import { Component } from '@angular/core';
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
// các field của node
interface OrganizationApiNode {
  id: number;
  parentId?: number | null;
  expandable?: boolean;
  expanded?: boolean;
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  children: OrganizationApiNode[];
}

interface OrganizationResponse {
  transactionTime: string;
  code: string;
  message: string;
  traceId: string;
  data: OrganizationApiNode[];
}
// dữ liệu mẫu cho tree-table
const sampleResponse: OrganizationResponse = {
  transactionTime: '2026-06-25 16:23:22',
  code: 'SSV-000',
  message: 'Thành công',
  traceId: '144501e4de5547f8a74d0addc3654055',
  data: [
    {
      id: 1,
      code: 'SSVN',
      name: 'Smart Solution VIỆT NAM',
      status: 'ACTIVE',
      children: [
        {
          id: 4,
          code: 'IT',
          name: 'Phòng công nghệ thông tin',
          status: 'ACTIVE',
          children: [
            {
              id: 7,
              code: 'BACKEND',
              name: 'Backend Team',
              status: 'ACTIVE',
              children: [
                {
                  id: 8,
                  code: 'JAVA',
                  name: 'Java Team',
                  status: 'ACTIVE',
                  children: [],
                },
              ],
            },
          ],
        },
        {
          id: 6,
          code: 'FINANCE',
          name: 'Phòng Tài Chính',
          status: 'ACTIVE',
          children: [],
        },
        {
          id: 9,
          code: 'MARKETING',
          name: 'Phòng Marketing',
          status: 'ACTIVE',
          children: [
            {
              id: 10,
              code: 'DIGITAL_MKT',
              name: 'Digital Marketing Team',
              status: 'ACTIVE',
              children: [
                {
                  id: 11,
                  code: 'CONTENT_TEAM',
                  name: 'Content Team',
                  status: 'ACTIVE',
                  children: [],
                },
              ],
            },
          ],
        },
        {
          id: 12,
          code: 'RECEPTION',
          name: 'Phòng Hành Chính - Lễ Tân',
          status: 'ACTIVE',
          children: [],
        },
        {
          id: 13,
          code: 'QA',
          name: 'Phòng kiểm thử chất lượng phần mềm',
          status: 'ACTIVE',
          children: [],
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-tree-table-demo',
  standalone: true,
  imports: [SsTreeTableComponent],
  templateUrl: './tree-table-demo.html',
  styleUrl: './tree-table-demo.css',
})
export class TreeTableDemoComponent {
  eventLog = 'Chưa có thao tác';
  readonly response = sampleResponse;
  //cấu hình tree-config từ OrganizationApiNode
  readonly config: SsTreeTableConfig<OrganizationApiNode> = {
    showHeader: true,
    showCheckbox: true,
    showStatus: true,
    cascadeSelection: true,
    rowHeight: 44,
    indent: 24,
    striped: false, 
    hoverable: true,
    toolbar: {
      search: {
        visible: true,
        placeholder: 'Tìm phòng ban, mã đơn vị...',
        clearable: true,
      },
      sort: true,
      settings: true,
      filter: true,
    },
    pagination: {
      visible: true,
      pageIndex: 1,
      pageSize: 6,
      pageSizeOptions: [6, 10, 20],
      quickActions: true,
    },
    selection: {
      mode: 'multiple',
      showCheckbox: true,
      cascade: true,
    },
    rowKey: 'id',
    parentKey: 'parentId',
    labelKey: 'name',
    expandableKey: 'expandable',
    emptyText: 'Không có đơn vị phù hợp',
  };

  readonly columns: SsTreeTableColumn<OrganizationApiNode>[] = [
    {
      key: 'name',
      title: 'Tên đơn vị',
      type: 'tree',
      width: 360,
      searchable: true,
      sortable: true,
      value: (node) => node.data?.name ?? node.label,
      filterType: 'text',
      filterPlaceholder: 'nhap ten don vi',
    },
    {
      key: 'code',
      title: 'Mã',
      field: 'code',
      width: 150,
      searchable: true,
      sortable: true,
    },
    {
      key: 'id',
      title: 'ID',
      field: 'id',
      width: 90,
      align: 'right',
      sortable: true,
    },
    {
      key: 'apiStatus',
      title: 'Trạng thái API',
      field: 'status',
      width: 150,
      searchable: true,
      sortable: true,
      formatter: (value) => (value === 'ACTIVE' ? 'ACTIVE' : String(value ?? '-')),
      filterType: 'multiselect',
      filters: [
        { text: 'hoat dong', value: 'ACTIVE' },
        { text: 'khong hoat dong', value: 'INACTIVE' },
      ],
    },
    {
      key: 'status',
      title: 'Hiển thị',
      type: 'status',
      width: 140,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      type: 'actions',
      width: 110,
      actions: [
        { key: 'view', label: 'Xem chi tiết' },
        { key: 'edit', label: 'Cập nhật' },
        { key: 'disable', label: 'Tạm ngưng', danger: true },
      ],
    },
  ];

  readonly rows: OrganizationApiNode[] = this.flattenOrganizations(this.response.data);

  onExpandedChange(event: SsTreeTableExpandedChangeEvent<OrganizationApiNode>) {
    this.eventLog = `${event.expanded ? 'Mở' : 'Đóng'}: ${event.node.label}`;
  }

  onCheckedChange(event: SsTreeTableCheckedChangeEvent<OrganizationApiNode>) {
    this.eventLog = `Đã chọn ${event.checkedKeys.length} dòng`;
  }

  onPageChange(event: SsTreeTablePageChangeEvent) {
    this.eventLog = `Trang ${event.pageIndex}, page size ${event.pageSize}`;
  }

  onSearchChange(event: SsTreeTableSearchChangeEvent) {
    this.eventLog = `Search: ${event.term || '(rỗng)'}`;
  }

  onFilterChange(event: SsTreeTableFilterChangeEvent) {
    this.eventLog = `Filter: ${event.filters.length} điều kiện`;
  }

  onActionClick(event: SsTreeTableActionClickEvent<OrganizationApiNode>) {
    this.eventLog = `${event.action.label}: ${event.node.label}`;
  }                                       

  onToolbarAction(event: SsTreeTableToolbarActionEvent) {
    this.eventLog = `Toolbar: ${event.type}`;
  }

  onVisibleColumnsChange(event: SsTreeTableVisibleColumnsChangeEvent) {
    this.eventLog = `Hiện ${event.visibleColumnKeys.length} cột, ẩn ${event.hiddenColumnKeys.length} cột`;
  }

  private flattenOrganizations(
    items: OrganizationApiNode[],
    parentId: number | null = null,
  ): OrganizationApiNode[] {
    return items.flatMap((item) => {
      const children = item.children ?? [];
      const row: OrganizationApiNode = {
        ...item,
        parentId,
        expandable: children.length > 0,
        expanded: children.length > 0,
        children: [],
      };
      return [row, ...this.flattenOrganizations(children, item.id)];
    });
  }
}
