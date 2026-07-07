import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface OrganizationApiNode {
  key?: string;
  parentKey?: string | null;
  id: number;
  expandable?: boolean;
  expanded?: boolean;
  code: string;
  name: string;
  typeCode?: string;
  typeName?: string;
  parentCode?: string | null;
  parentName?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | string;
  children?: OrganizationApiNode[];
}

export interface ApiResponse<T> {
  transactionTime: string;
  code: string;
  message: string;
  traceId: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface OrganizationRootResult {
  responseInfo: Pick<ApiResponse<unknown>, 'message' | 'transactionTime' | 'traceId'>;
  rows: OrganizationApiNode[];
  total: number;
}

export interface OrganizationSearchPayload {
  page: number;
  size: number;
  keyword?: string;
  typeCode?: string;
  status?: string;
  parentCode?: string;
  sort?: string;
  sortDirection?: string;
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
      .pipe(map((response) => (response.data ?? []).map((item) => this.toTreeRow(item, parentCode))));
  }

  searchOrganizations(payload: OrganizationSearchPayload): Observable<OrganizationRootResult> {
    const backendPayload: OrganizationSearchPayload = {
      ...payload,
      page: Math.max(payload.page - 1, 0),
    };

    return this.http
      .post<ApiResponse<PageResponse<OrganizationApiNode>>>(`${ORGANIZATION_API_URL}/search-tree`, backendPayload)
      .pipe(
        map((response) => {
          const pageData = response.data;
          return {
            responseInfo: {
              message: response.message,
              transactionTime: response.transactionTime,
              traceId: response.traceId,
            },
            rows: (pageData?.content ?? []).map((item) => this.toTreeRow(item, item.parentCode ?? null)),
            total: pageData?.totalElements ?? 0,
          };
        }),
      );
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
