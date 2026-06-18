import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../auth.service';
import { PositionItem, PositionRequest } from '../../auth.types';

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './positions.html',
  styleUrl: '../admin-page.css'
})
export class PositionsComponent implements OnInit {
  positions: PositionItem[] = [];
  editingId: number | null = null;
  form: PositionRequest = this.emptyForm();
  isLoading = true;
  errorMessage = '';

  constructor(private readonly authService: AuthService) {}

  ngOnInit() {
    this.loadPositions();
  }

  save() {
    const request = { ...this.form };
    const action = this.editingId
      ? this.authService.updatePosition(this.editingId, request)
      : this.authService.createPosition(request);

    action.subscribe({
      next: () => {
        this.cancelEdit();
        this.loadPositions();
      },
      error: () => this.errorMessage = 'Khong luu duoc position.'
    });
  }

  edit(position: PositionItem) {
    this.editingId = position.id;
    this.form = {
      code: position.code,
      name: position.name,
      description: position.description || ''
    };
  }

  delete(position: PositionItem) {
    if (!confirm(`Xoa position ${position.code}?`)) {
      return;
    }
    this.authService.deletePosition(position.id).subscribe({
      next: () => this.loadPositions(),
      error: () => this.errorMessage = 'Khong xoa duoc position.'
    });
  }

  cancelEdit() {
    this.editingId = null;
    this.form = this.emptyForm();
  }

  private loadPositions() {
    this.isLoading = true;
    this.authService.loadAdminOverview().subscribe({
      next: (overview) => {
        this.positions = overview.positions;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Khong tai duoc danh sach positions.';
        this.isLoading = false;
      }
    });
  }

  private emptyForm(): PositionRequest {
    return { code: '', name: '', description: '' };
  }
}
