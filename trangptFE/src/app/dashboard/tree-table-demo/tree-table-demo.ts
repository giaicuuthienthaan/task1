import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  SsTreeTableActionClickEvent,
  SsTreeTableCheckedChangeEvent,
  SsTreeTableColumn,
  SsTreeTableComponent,
  SsTreeTableConfig,
  SsTreeTableExpandedChangeEvent,
  SsTreeTableFilterChangeEvent,
  SsTreeTablePageChangeEvent,
  SsTreeTableSearchChangeEvent,
  SsTreeTableToolbarActionEvent,
  SsTreeTableVisibleColumnsChangeEvent,
} from '@platform/ui-kit';
import {
  ApiResponse,
  OrganizationApiNode,
  OrganizationTreeDemoService,
} from '../../service/organization-tree-demo.service';

@Component({
  selector: 'app-tree-table-demo',
  standalone: true,
  imports: [CommonModule, SsTreeTableComponent],
  templateUrl: './tree-table-demo.html',
  styleUrl: './tree-table-demo.css',
})
export class TreeTableDemoComponent implements OnInit {
  // Inject service riêng để gọi API organization.
  private readonly organizationService = inject(OrganizationTreeDemoService);

  // Log nhỏ hiển thị trên UI để biết thao tác gần nhất của user/table.
  eventLog = 'Chua co thao tac';
  // State loading riêng của page demo. Config.loading bên dưới mới là loading truyền vào ss-tree-table.
  loading = false;
  // Message lỗi hiển thị trên UI khi API /parents load thất bại.
  errorMessage = '';
  // Lưu meta response backend để demo hiển thị message, transactionTime, traceId.
  responseInfo: Pick<ApiResponse<unknown>, 'message' | 'transactionTime' | 'traceId'> | null = null;
  // rows là data truyền vào [data] của ss-tree-table.
  // Demo đang dùng flat data theo chuẩn: key, parentKey, expandable + các field nghiệp vụ.
  rows: OrganizationApiNode[] = [];
  // Lưu các node đã load children thành công. Nếu user đóng/mở lại node thì không gọi API lặp.
  private readonly loadedChildKeys = new Set<string>();
  // Lưu các node đang gọi API children. Dùng để chặn double click/click nhanh gây request trùng.
  private readonly loadingChildKeys = new Set<string>();

  // Config điều khiển hành vi chung của ss-tree-table: toolbar, pagination, selection, layout...
  // Columns bên dưới mới quy định từng cột hiển thị field nào.
  config: SsTreeTableConfig<OrganizationApiNode> = {
    // Bật lazy để pagination do backend xử lý.
    // Nếu không bật, component sẽ tự cắt page trên 6 rows đã load và page 2 sẽ bị rỗng.
    lazy: true,
    // Hiển thị header cột.
    // Hiển thị checkbox chọn dòng.
    showCheckbox: true,
    // Cho phép hiển thị status built-in nếu column có type='status'.
    showStatus: true,
    // Khi chọn cha thì chọn/bỏ chọn cả cây con.
    cascadeSelection: true,
    // Chiều cao mỗi row trong table.
    rowHeight: 44,
    // Độ thụt vào mỗi cấp tree.
    indent: 24,
    // striped=false: không hiển thị nền xen kẽ theo dòng.
    striped: false,
    // hoverable=true: hover vào row có background.
    hoverable: true,
    toolbar: {
      search: {
        // Bật ô search trên toolbar.
        visible: true,
        placeholder: 'Tim phong ban, ma don vi...',
        // Có nút clear search.
        clearable: true,
      },
      // Bật các nút sort/settings/filter trên toolbar.
      sort: true,
      settings: true,
      filter: true,
    },
    pagination: {
      // Hiển thị footer pagination.
      visible: true,
      // Trang hiện tại, ss-tree-table dùng index bắt đầu từ 1.
      pageIndex: 1,
      // Demo lấy 5 root node mỗi page từ API /parents.
      pageSize: 5,
      pageSizeOptions: [5, 10, 20],
      // Hiển thị các nút first/prev/next/last/reload.
      quickActions: true,
    },
    selection: {
      // Cho phép chọn nhiều dòng.
      mode: 'multiple',
      showCheckbox: true,
      // Checkbox cha/con liên kết nhau.
      cascade: true,
    },
    labelKey: 'name',
    emptyText: 'Khong co don vi phu hop',
  };

  // Danh sách cột hiển thị trong tree table.
  // Mỗi cột có key riêng; field là tên property trong node.data để component đọc value.
  readonly columns: SsTreeTableColumn<OrganizationApiNode>[] = [
    {
      key: 'name',
      title: 'Ten don vi',
      // type='tree' là cột chính của tree: hiển thị nút expand, indent, icon node và label.
      type: 'tree',
      width: 360,
      // Cho phép cột này tham gia search/sort local của tree-table.
      searchable: true,
      sortable: true,
      // value ưu tiên cao hơn field. Ở đây lấy name từ data, nếu không có thì dùng label đã normalize.
      value: (node) => node.data?.name ?? node.label,
      // filterType='text' sẽ hiển thị input text trong panel filter.
      filterType: 'text',
      filterPlaceholder: 'Nhap ten don vi',
    },
    {
      key: 'code',
      title: 'Ma',
      // Đọc node.data.code để hiển thị.
      field: 'code',
      width: 150,
      searchable: true,
      sortable: true,
    },
    {
      key: 'id',
      title: 'ID',
      // id chỉ để hiển thị, còn quan hệ tree demo đang dùng key=code và parentKey=parentCode.
      field: 'id',
      width: 90,
      align: 'right',
      sortable: true,
    },
    {
      key: 'apiStatus',
      title: 'Trang thai API',
      field: 'status',
      width: 150,
      searchable: true,
      sortable: true,
      // Formatter biến value raw thành text hiển thị. Nếu value null/undefined thì hiển thị '-'.
      formatter: (value) => (value === 'ACTIVE' ? 'ACTIVE' : String(value ?? '-')),
      // multiselect hiển thị danh sách checkbox trong panel filter.
      filterType: 'multiselect',
      filters: [
        { text: 'hoat dong', value: 'ACTIVE' },
        { text: 'khong hoat dong', value: 'INACTIVE' },
      ],
    },
    {
      key: 'status',
      title: 'Hien thi',
      // type='status' dùng status đã normalize trong ss-tree-table để hiển thị chấm/trạng thái.
      type: 'status',
      width: 140,
    },
    {
      key: 'actions',
      title: 'Thao tac',
      // type='actions' hiển thị menu action cho từng dòng.
      type: 'actions',
      width: 110,
      actions: [
        { key: 'view', label: 'Xem chi tiet' },
        { key: 'edit', label: 'Cap nhat' },
        { key: 'disable', label: 'Tam ngung', danger: true },
      ],
    },
  ];

  ngOnInit(): void {
    // Khi vào màn hình, chỉ load danh sách root/parent trước.
    // Children sẽ load lazy khi user click tam giác expand.
    this.loadRootOrganizations();
  }

  loadRootOrganizations(page = 1, size = this.config.pagination?.pageSize ?? 6): void {
    // Reset state UI trước khi gọi API root.
    this.loading = true;
    this.errorMessage = '';
    this.eventLog = 'Dang tai danh sach don vi goc...';

    this.organizationService
      // Lấy đúng page/pageSize hiện tại từ API /parents.
      .getRootOrganizations(page, size)
      .subscribe({
        next: (result) => {
          // responseInfo chỉ để hiển thị meta của API trên UI demo.
          this.responseInfo = result.responseInfo;
          // result.rows đã được service map về chuẩn key/parentKey/expandable.
          this.rows = result.rows;
          // Load lại root thì bỏ cache children cũ, vì cây mới có thể đã thay đổi.
          this.loadedChildKeys.clear();
          this.loadingChildKeys.clear();
          // Config là object input của ss-tree-table, nên update bằng spread để Angular nhận thấy thay đổi.
          this.config = {
            ...this.config,
            loading: false,
            pagination: {
              ...this.config.pagination,
              pageIndex: page,
              pageSize: size,
              // total lấy từ PageResponse backend để pagination biết tổng root node.
              total: result.total,
            },
          };
          this.eventLog = `Da tai ${this.rows.length} don vi goc`;
          this.loading = false;
        },
        error: (error) => {
          // Khi API lỗi, clear data để table hiển thị emptyText và hiển thị message lỗi trên page.
          console.error('Cannot load root organizations:', error);
          this.rows = [];
          this.responseInfo = null;
          this.errorMessage = 'Khong the tai danh sach don vi goc tu backend.';
          this.eventLog = 'Tai du lieu that bai';
          this.config = { ...this.config, loading: false };
          this.loading = false;
        },
      });

    // Bật loading của ss-tree-table ngay sau khi subscribe.
    // Dòng này đặt sau subscribe vẫn chạy đồng bộ trước khi response async trả về.
    this.config = { ...this.config, loading: true };
  }

  onExpandedChange(event: SsTreeTableExpandedChangeEvent<OrganizationApiNode>) {
    // Event có sẵn của ss-tree-table: bắn ra cả khi mở và khi đóng node.
    // Dùng ở demo để hiển thị log, không gọi API tại đây để tránh gọi cả lúc collapse.
    this.eventLog = `${event.expanded ? 'Mo' : 'Dong'}: ${event.node.label}`;
  }

  onNodeExpand(event: SsTreeTableExpandedChangeEvent<OrganizationApiNode>): void {
    // nodeExpand chỉ bắn ra khi user mở node. Đây là nơi demo lazy-load children.
    // Demo dùng code làm key, nên ưu tiên event.node.data.code; fallback sang event.key nếu data không có.
    const parentCode = event.node.data?.code ?? String(event.key);
    // Nếu node đã load children rồi, hoặc đang load, thì thoát sớm để không gọi API trùng.
    if (this.loadedChildKeys.has(parentCode) || this.loadingChildKeys.has(parentCode)) return;

    // Đánh dấu node đang load children.
    this.loadingChildKeys.add(parentCode);
    this.eventLog = `Dang tai don vi con cua ${event.node.label}...`;

    this.organizationService.getChildren(parentCode).subscribe({
      next: (children) => {
        // Request xong thì bỏ khỏi set loading, và đánh dấu node này đã load thành công.
        this.loadingChildKeys.delete(parentCode);
        this.loadedChildKeys.add(parentCode);

        if (!children.length) {
          // Nếu API trả về rỗng, tắt expandable để node không còn hiển thị như có con nữa.
          this.rows = this.rows.map((row) => (row.key === parentCode ? { ...row, expandable: false } : row));
          this.eventLog = `${event.node.label} khong co don vi con`;
          return;
        }

        // Tránh append trùng nếu API bị gọi lại hoặc data đã tồn tại trong rows.
        const existingKeys = new Set(this.rows.map((row) => row.key));
        const newChildren = children.filter((child) => !existingKeys.has(child.key));
        // Append children vào flat list. ss-tree-table sẽ tự dựng cây bằng key/parentKey.
        this.rows = [...this.rows, ...newChildren];
        this.eventLog = `Da tai ${newChildren.length} don vi con cua ${event.node.label}`;
      },
      error: (error) => {
        // Gọi children lỗi thì cho phép user thử lại lần sau bằng cách xóa khỏi loadingChildKeys,
        // nhưng không add vào loadedChildKeys.
        console.error('Cannot load child organizations:', error);
        this.loadingChildKeys.delete(parentCode);
        this.eventLog = `Khong the tai don vi con cua ${event.node.label}`;
      },
    });
  }

  onCheckedChange(event: SsTreeTableCheckedChangeEvent<OrganizationApiNode>) {
    // Event checkbox selection: checkedKeys là danh sách key đang được chọn sau khi tính cascade.
    this.eventLog = `Da chon ${event.checkedKeys.length} dong`;
  }

  onPageChange(event: SsTreeTablePageChangeEvent) {
    this.eventLog = `Trang ${event.pageIndex}, page size ${event.pageSize}`;
    this.loadRootOrganizations(event.pageIndex, event.pageSize);
  }

  onSearchChange(event: SsTreeTableSearchChangeEvent) {
    // Event search thay đổi. Demo để component xử lý client-side và chỉ hiển thị log.
    this.eventLog = `Search: ${event.term || '(rong)'}`;
  }

  onFilterChange(event: SsTreeTableFilterChangeEvent) {
    // Event filter thay đổi. filters là danh sách điều kiện filter hiện tại.
    this.eventLog = `Filter: ${event.filters.length} dieu kien`;
  }

  onActionClick(event: SsTreeTableActionClickEvent<OrganizationApiNode>) {
    // Event khi click action trong cột Thao tác.
    this.eventLog = `${event.action.label}: ${event.node.label}`;
  }

  onToolbarAction(event: SsTreeTableToolbarActionEvent) {
    // Nút reload của toolbar được component emit như một toolbarAction.
    if (event.type === 'reload') {
      this.loadRootOrganizations();
      return;
    }
    this.eventLog = `Toolbar: ${event.type}`;
  }

  onVisibleColumnsChange(event: SsTreeTableVisibleColumnsChangeEvent) {
    // Event settings ẩn/hiện cột. Demo hiển thị số cột đang hiện/ẩn.
    this.eventLog = `Hien ${event.visibleColumnKeys.length} cot, an ${event.hiddenColumnKeys.length} cot`;
  }
}
