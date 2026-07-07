import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface OrganizationApiNode {
  // key là định danh chuẩn mà ss-tree-table ưu tiên đọc. Demo này dùng code vì API children lấy theo parentCode.
  key?: string;
  // parentKey lưu key của cha. Root sẽ có parentKey = null, con sẽ có parentKey = parentCode.
  parentKey?: string | null;
  // id là định danh database của bản ghi, vẫn giữ lại để hiển thị cột ID.
  id: number;
  // expandable cho biết dòng có hiển thị nút tam giác expand hay không.
  expandable?: boolean;
  // expanded cho biết node có mở sẵn hay không khi render lần đầu.
  expanded?: boolean;
  // Các field nghiệp vụ bên backend trả về, dùng để hiển thị theo columns.
  code: string;
  name: string;
  typeCode?: string;
  typeName?: string;
  parentCode?: string | null;
  parentName?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | string;
  // Khi dùng flat data + parentKey, children để rỗng và tree table sẽ tự dựng cây bằng key/parentKey.
  children?: OrganizationApiNode[];
}

export interface ApiResponse<T> {
  // Wrapper response chung của backend: thông tin meta + data thật sự.
  transactionTime: string;
  code: string;
  message: string;
  traceId: string;
  data: T;
}

export interface PageResponse<T> {
  // PageResponse của backend cho API phân trang: content là danh sách record của page hiện tại.
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface OrganizationRootResult {
  // responseInfo dùng để demo hiển thị message/traceId ở UI.
  responseInfo: Pick<ApiResponse<unknown>, 'message' | 'transactionTime' | 'traceId'>;
  // rows là dữ liệu đã chuẩn hóa, sẵn sàng truyền vào [data] của ss-tree-table.
  rows: OrganizationApiNode[];
  // total dùng cho pagination của tree table.
  total: number;
}

export interface OrganizationCreatePayload {
  code: string;
  name: string;
  description?: string;
  address?: string;
  typeCode: string;
  parentCode?: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
}

export interface OrganizationDetail {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  address?: string | null;
  typeCode?: string | null;
  typeName?: string | null;
  parentCode?: string | null;
  parentName?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | string;
  path?: string | null;
}

// Dùng URL tương đối để Angular dev-server proxy sang BE, tránh lỗi CORS khi chạy local.
const ORGANIZATION_API_URL = '/master-data/api/organizations';

@Injectable({ providedIn: 'root' })
export class OrganizationTreeDemoService {
  private readonly http = inject(HttpClient);

  getRootOrganizations(page = 1, size = 5): Observable<OrganizationRootResult> {
    // Gọi API lấy danh sách node gốc. Children sẽ được lấy sau bằng getChildren().
    return this.http
      .get<ApiResponse<PageResponse<OrganizationApiNode>>>(`${ORGANIZATION_API_URL}/parents`, {
        params: {
          page: String(page),
          size: String(size),
        },
      })
      .pipe(
        map((response) => {
          const pageData = response.data;
          // Chuyển response BE về shape gọn hơn để component chỉ cần bind UI/state.
          return {
            responseInfo: {
              message: response.message,
              transactionTime: response.transactionTime,
              traceId: response.traceId,
            },
            // BE /parents trả node gốc, FE map về chuẩn key/parentKey của ss-tree-table.
            rows: (pageData?.content ?? []).map((item) => this.toTreeRow(item, null)),
            total: pageData?.totalElements ?? 0,
          };
        }),
      );
  }

  getChildren(parentCode: string): Observable<OrganizationApiNode[]> {
    // Gọi API lấy con trực tiếp của node cha. parentCode cũng chính là key của node cha trong demo này.
    return this.http
      .get<ApiResponse<OrganizationApiNode[]>>(`${ORGANIZATION_API_URL}/children/${encodeURIComponent(parentCode)}`)
      //pip xử lý dữ liệu trả về từ Observable
      .pipe(map((response) => (response.data ?? []).map((item) => this.toTreeRow(item, parentCode))));
  }

  createOrganization(payload: OrganizationCreatePayload): Observable<OrganizationApiNode> {
    return this.http
      .post<ApiResponse<OrganizationApiNode>>(ORGANIZATION_API_URL, payload)
      .pipe(map((response) => this.toTreeRow(response.data, response.data?.parentCode ?? payload.parentCode ?? null)));
  }

  getOrganizationById(id: number): Observable<OrganizationDetail> {
    return this.http
      .get<ApiResponse<OrganizationDetail>>(`${ORGANIZATION_API_URL}/${id}`)
      .pipe(map((response) => response.data));
  }

  private toTreeRow(item: OrganizationApiNode, parentKey: string | null): OrganizationApiNode {
    // Chuẩn hóa row theo contract của ss-tree-table:
    // - key: định danh của row, ở đây dùng code.
    // - parentKey: key của cha, root là null.
    // - expandable: hiển thị nút tam giác để có thể lazy-load children khi user click.
    // - children []: data demo đi theo flat mode, tree table sẽ dùng key/parentKey để tự dựng cây.
    return {
      ...item,
      key: item.code,
      parentKey,
      expandable: item.expandable ?? true,
      expanded: false,
      children: [],
    };
  }
}
