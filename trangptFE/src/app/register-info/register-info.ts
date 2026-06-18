import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { SsButtonComponent, SsCheckboxComponent, SsDatepickerComponent, SsInputComponent } from '@platform/ui-kit';

@Component({
  selector: 'app-register-info',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    SsInputComponent,
    SsDatepickerComponent,
    SsCheckboxComponent,
    SsButtonComponent
  ],
  templateUrl: './register-info.html',
  styleUrl: './register-info.css'
})
export class RegisterInfoComponent {
  isSubmitting = false;
  buttonLoading = false;
  submittedValue: unknown = null;

  readonly maxBirthDate = new Date();
  readonly minWorkDate = new Date();
  readonly maxWorkDate = new Date(new Date().getFullYear() + 1, 11, 31);
  readonly minDemoDate = new Date();
  readonly maxDemoDate = new Date(new Date().getFullYear(), 11, 31);

  readonly contactOptions = [
    { label: 'Email', value: 'email' },
    { label: 'Điện thoại', value: 'phone' },
    { label: 'Zalo', value: 'zalo' }
  ];

  readonly checkboxDemoOptions = [
    { label: 'Email', value: 'email' },
    { label: 'Điện thoại', value: 'phone' },
    { label: 'Zalo', value: 'zalo' },
    { label: 'Kênh đã khóa', value: 'locked', disabled: true }
  ];

  readonly blockWeekend = (current: Date): boolean => current.getDay() === 0 || current.getDay() === 6;

  inputText = '';
  inputPassword = '';
  inputTextarea = 'Nội dung mẫu để kiểm tra textarea và bộ đếm ký tự.';
  inputHorizontal = 'Layout ngang';
  inputInline = 'Inline';
  inputReadonly = 'Chỉ đọc';
  inputDisabled = 'Đã vô hiệu';
  inputHiddenError = '   ';

  checkboxSingle = false;
  checkboxIndeterminate = true;
  checkboxDisabled = true;
  checkboxGroupValues: string[] = ['email'];

  dateBasic: Date | null = null;
  dateMonth: Date | null = null;
  dateWithTime: Date | null = null;
  dateNoClear: Date | null = new Date();
  dateNoIcon: Date | null = null;
  dateIso: string | null = null;
  dateTimestamp: number | null = null;
  dateCustomFormat: string | null = null;
  dateRangeStart: Date | null = null;
  dateRangeEnd: Date | null = null;
  dateDisabled: Date | null = new Date();

  private readonly fb = inject(FormBuilder);

  readonly registerForm = this.fb.group({
    fullName: ['', [Validators.required]],
    employeeCode: ['', [Validators.required]],
    email: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    birthday: [null as Date | null, [Validators.required]],
    workStartDate: [null as Date | null, [Validators.required]],
    workEndDate: [null as Date | null, [Validators.required]],
    contactMethods: [[] as string[], [Validators.required]],
    note: [''],
    acceptPolicy: [false, [Validators.requiredTrue]]
  }, { validators: this.workDateOrderValidator });

  get workDateOrderError(): boolean {
    return Boolean(
      this.registerForm.errors?.['workDateOrder'] &&
      (this.registerForm.controls.workStartDate.touched || this.registerForm.controls.workEndDate.touched)
    );
  }

  startLoadingDemo(): void {
    this.buttonLoading = true;
    window.setTimeout(() => {
      this.buttonLoading = false;
    }, 1000);
  }

  clearPersonalLayer(): void {
    this.registerForm.patchValue({
      fullName: '',
      employeeCode: '',
      email: '',
      phone: ''
    });
    this.markControlsPristine(['fullName', 'employeeCode', 'email', 'phone']);
  }

  clearTimeLayer(): void {
    this.registerForm.patchValue({
      birthday: null,
      workStartDate: null,
      workEndDate: null
    });
    this.markControlsPristine(['birthday', 'workStartDate', 'workEndDate']);
    this.registerForm.updateValueAndValidity();
  }

  clearConfirmLayer(): void {
    this.registerForm.patchValue({
      contactMethods: [],
      note: '',
      acceptPolicy: false
    });
    this.markControlsPristine(['contactMethods', 'note', 'acceptPolicy']);
  }

  clearButtonLayer(): void {
    this.buttonLoading = false;
  }

  clearInputLayer(): void {
    this.inputText = '';
    this.inputPassword = '';
    this.inputTextarea = '';
    this.inputHorizontal = '';
    this.inputInline = '';
    this.inputHiddenError = '';
  }

  clearCheckboxLayer(): void {
    this.checkboxSingle = false;
    this.checkboxIndeterminate = false;
    this.checkboxGroupValues = [];
  }

  clearDatepickerLayer(): void {
    this.dateBasic = null;
    this.dateMonth = null;
    this.dateWithTime = null;
    this.dateNoClear = null;
    this.dateNoIcon = null;
    this.dateIso = null;
    this.dateTimestamp = null;
    this.dateCustomFormat = null;
    this.dateRangeStart = null;
    this.dateRangeEnd = null;
  }

  onSubmit(): void {
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.submittedValue = this.registerForm.getRawValue();

    window.setTimeout(() => {
      this.isSubmitting = false;
    }, 800);
  }

  onReset(): void {
    this.registerForm.reset({
      fullName: '',
      employeeCode: '',
      email: '',
      phone: '',
      birthday: null,
      workStartDate: null,
      workEndDate: null,
      contactMethods: [],
      note: '',
      acceptPolicy: false
    });
    this.submittedValue = null;
  }

  private markControlsPristine(controlNames: string[]): void {
    controlNames.forEach(controlName => {
      const control = this.registerForm.get(controlName);
      control?.markAsPristine();
      control?.markAsUntouched();
    });
  }

  private workDateOrderValidator(control: AbstractControl): ValidationErrors | null {
    const start = control.get('workStartDate')?.value;
    const end = control.get('workEndDate')?.value;

    if (!start || !end) {
      return null;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return startDate.getTime() > endDate.getTime() ? { workDateOrder: true } : null;
  }
}
