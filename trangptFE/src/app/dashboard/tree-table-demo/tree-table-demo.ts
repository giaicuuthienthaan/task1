import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SsDialogButtonAction,
  SsDialogComponent,
  SsDialogPopupButton,
  SsButtonComponent,
  SsInputComponent,
  SsPopupButton,
  SsPopupButtonAction,
  SsPopupComponent,
  SsPopupType,
  SsTreeTableActionClickEvent,
  SsTreeTableCheckedChangeEvent,
  SsTreeTableColumn,
  SsTreeTableComponent,
  SsTreeTableConfig,
  SsTreeTableExpandedChangeEvent,
  SsTreeTableFilterChangeEvent,
  SsTreeTableFilterValue,
  SsTreeTablePageChangeEvent,
  SsTreeTableSearchChangeEvent,
  SsTreeTableToolbarActionEvent,
  SsTreeTableVisibleColumnsChangeEvent,
} from '@platform/ui-kit';
import {
  ApiResponse,
  OrganizationCreatePayload,
  OrganizationApiNode,
  OrganizationDetail,
  OrganizationTreeDemoService,
} from '../../service/organization-tree-demo.service';

@Component({
  selector: 'app-tree-table-demo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SsTreeTableComponent,
    SsDialogComponent,
    SsButtonComponent,
    SsInputComponent,
    SsPopupComponent,
  ],
  templateUrl: './tree-table-demo.html',
  styleUrl: './tree-table-demo.css',
})
export class TreeTableDemoComponent implements OnInit {
  @ViewChild('organizationFilterTemplate', { static: true })
  private organizationFilterTemplate?: TemplateRef<unknown>;

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
  isCreateDialogOpen = false;
  creatingOrganization = false;
  createErrorMessage = '';
  createForm: OrganizationCreatePayload = this.emptyCreateForm();
  resultPopup: { visible: boolean; type: SsPopupType; title: string; message: string } = {
    visible: false,
    type: 'success',
    title: '',
    message: '',
  };
  createDialogButtons: SsDialogPopupButton[] = [
    { label: 'Huy', type: 'default', action: 'cancel' },
    { label: 'Luu', type: 'primary', action: 'confirm' },
  ];
  isDetailDialogOpen = false;
  loadingDetail = false;
  detailErrorMessage = '';
  selectedOrganizationDetail: OrganizationDetail | null = null;
  resultPopupButtons: SsPopupButton[] = [{ label: 'Dong', type: 'primary', action: 'close' }];
  readonly statusFilterOptions = [
    { text: 'Hoat dong', value: 'ACTIVE' },
    { text: 'Khong hoat dong', value: 'INACTIVE' },
  ];
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
    // Demo vẫn muốn thao tác search/filter/sort trên dữ liệu đã load, đồng thời emit event để có thể nối API sau này.
    queryMode: 'hybrid',
    // Hiển thị header cột.
    showHeader: true,
    // Hiển thị checkbox chọn dòng.
    showCheckbox: true,
    
    // Cho phép kéo mép header để thay đổi độ rộng cột giống ss-table.
    columns: {
      resizable: true,
      defaultWidth: '160px',
      minWidth: 96,
    },
    // Cho phép hiển thị status built-in nếu column có type='status'.
    showStatus: true,
    // Khi chọn cha thì chọn/bỏ chọn cả cây con.
    cascadeSelection: true,
    // Chiều cao mỗi row trong table.
    rowHeight: 44,
    // Chiều cao cố định vùng thân bảng, giống settings.scrollY của ss-data-table.
    scrollY: '320px',
    // Độ thụt vào mỗi cấp tree.
    indent: 24,
    // striped=true: hiển thị nền xám/trắng xen kẽ theo dòng giống ss-data-table.
    striped: true,
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
      // Bật các nút thao tác chung cạnh Filter, ví dụ Thêm mới.
      primary: true,
      primaryActions: [
        {
          key: 'create',
          label: 'Them moi',
          icon: 'plus',
          type: 'primary',
        },
      ],
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
        { key: 'edit', label: 'Sua' },
        { key: 'delete', label: 'Xoa', danger: true },
      ],
    },
  ];

  ngOnInit(): void {
    this.config = {
      ...this.config,
      filterTemplate: this.organizationFilterTemplate as SsTreeTableConfig<OrganizationApiNode>['filterTemplate'],
    };
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

  //load dữ liệu con
  onExpandedChange(event: SsTreeTableExpandedChangeEvent<OrganizationApiNode>) {
    // Event có sẵn của ss-tree-table: bắn ra cả khi mở và khi đóng node.
    // Dùng ở demo để hiển thị log, không gọi API tại đây để tránh gọi cả lúc collapse.
    this.eventLog = `${event.expanded ? 'Mo' : 'Dong'}: ${event.node.label}`;
  }

  //khi click expand thì gọi API lấy children
  onNodeExpand(event: SsTreeTableExpandedChangeEvent<OrganizationApiNode>): void {
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

// THÊM MỚI TỔ CHỨC
  openCreateDialog(): void {
    this.createForm = this.emptyCreateForm();
    this.createErrorMessage = '';
    this.isCreateDialogOpen = true;
  }

  closeCreateDialog(): void {
    if (this.creatingOrganization) return;
    this.isCreateDialogOpen = false;
    this.createErrorMessage = '';
  }

  onCreateDialogAction(action: SsDialogButtonAction): void {
    if (action === 'confirm') {
      this.submitCreateOrganization();
      return;
    }
    if (action === 'cancel' || action === 'close') {
      this.closeCreateDialog();
    }
  }

  onResultPopupAction(_action: SsPopupButtonAction): void {
    this.resultPopup = {
      ...this.resultPopup,
      visible: false,
    };
  }

  openDetailDialog(node: OrganizationApiNode): void {
    if (!node.id) {
      this.eventLog = 'Khong tim thay ID cua dong can xem';
      return;
    }

    this.isDetailDialogOpen = true;
    this.loadingDetail = true;
    this.detailErrorMessage = '';
    this.selectedOrganizationDetail = null;
    this.eventLog = `Dang tai chi tiet ${node.name}...`;

    this.organizationService.getOrganizationById(node.id).subscribe({
      next: (detail) => {
        this.selectedOrganizationDetail = detail;
        this.loadingDetail = false;
        this.eventLog = `Da tai chi tiet ${detail.name}`;
      },
      error: (error) => {
        this.loadingDetail = false;
        this.detailErrorMessage = error?.error?.message || 'Khong the tai chi tiet to chuc';
        this.eventLog = 'Tai chi tiet that bai';
        console.error('Cannot load organization detail:', error);
      },
    });
  }

  submitCreateOrganization(): void {
    const payload = this.normalizeCreatePayload();
    if (!payload.code || !payload.name || !payload.typeCode || !payload.status) {
      this.createErrorMessage = 'Vui long nhap code, ten, loai va trang thai';
      return;
    }

    this.creatingOrganization = true;
    this.syncCreateDialogButtons();
    this.createErrorMessage = '';
    this.organizationService.createOrganization(payload).subscribe({
      next: (created) => {
        this.creatingOrganization = false;
        this.syncCreateDialogButtons();
        this.isCreateDialogOpen = false;
        this.eventLog = `Da tao don vi ${created.name}`;
        this.resultPopup = {
          visible: true,
          type: 'success',
          title: 'Tao to chuc thanh cong',
          message: `Da tao don vi ${created.name}`,
        };
        this.loadRootOrganizations(this.config.pagination?.pageIndex ?? 1, this.config.pagination?.pageSize ?? 5);
      },
      error: (error) => {
        this.creatingOrganization = false;
        this.syncCreateDialogButtons();
        this.createErrorMessage = error?.error?.message || 'Khong the tao to chuc';
        this.resultPopup = {
          visible: true,
          type: 'error',
          title: 'Tao to chuc that bai',
          message: this.createErrorMessage,
        };
        console.error('Cannot create organization:', error);
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

  isStatusFilterChecked(filterModel: Record<string, SsTreeTableFilterValue>, value: string): boolean {
    const current = filterModel['apiStatus'];
    return Array.isArray(current) && current.some((item) => String(item) === value);
  }

  toggleStatusFilter(
    filterModel: Record<string, SsTreeTableFilterValue>,
    value: string,
    checked: boolean,
  ): void {
    const current = filterModel['apiStatus'];
    const selectedValues = Array.isArray(current) ? current : [];
    filterModel['apiStatus'] = checked
      ? [...selectedValues, value]
      : selectedValues.filter((item) => String(item) !== value);
  }

  onActionClick(event: SsTreeTableActionClickEvent<OrganizationApiNode>) {
    if (event.action.key === 'view') {
      this.openDetailDialog(event.node.data ?? (event.node as unknown as OrganizationApiNode));
      return;
    }

    this.eventLog = `${event.action.label}: ${event.node.label}`;
  }

  onToolbarAction(event: SsTreeTableToolbarActionEvent) {
    if (event.type === 'primary' && event.actionKey === 'create') {
      this.openCreateDialog();
      return;
    }

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
  private emptyCreateForm(): OrganizationCreatePayload {
    return {
      code: '',
      name: '',
      description: '',
      address: '',
      typeCode: '',
      parentCode: '',
      status: 'ACTIVE',
    };
  }

  //hàm chuẩn hóa payload trước khi gọi API createOrganization
  private normalizeCreatePayload(): OrganizationCreatePayload {
    return {
      code: this.createForm.code.trim().toUpperCase(),
      name: this.createForm.name.trim(),
      description: this.createForm.description?.trim() || undefined,
      address: this.createForm.address?.trim() || undefined,
      typeCode: this.createForm.typeCode.trim().toUpperCase(),
      parentCode: this.createForm.parentCode?.trim().toUpperCase() || undefined,
      status: this.createForm.status,
    };
  }

  private syncCreateDialogButtons(): void {
    this.createDialogButtons = [
      { label: 'Huy', type: 'default', action: 'cancel', disabled: this.creatingOrganization },
      { label: 'Luu', type: 'primary', action: 'confirm', loading: this.creatingOrganization, disabled: this.creatingOrganization },
    ];
  }
}
