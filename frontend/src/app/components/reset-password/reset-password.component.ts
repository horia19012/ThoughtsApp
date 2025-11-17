import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit{
  resetMode = false;
  resetToken: string | null = null;
  resetForm: FormGroup;
  isResetting = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.resetMode = true;
        this.resetToken = token;
      }
    });
  }

  onResetPassword() {
    if (this.resetForm.invalid || this.resetForm.value.newPassword !== this.resetForm.value.confirmPassword) {
      return;
    }

    this.isResetting = true;

    this.authService.setNewPassword({
      token: this.resetToken!,
      newPassword: this.resetForm.value.newPassword
    }).subscribe({
      next: () => {
        this.isResetting = false;
        alert('Password reset successfully!');
        this.resetMode = false;
      },
      error: (err) => {
        this.isResetting = false;
        alert(err.error || 'Reset failed');
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  isResetFieldInvalid(field: string) {
    const control = this.resetForm.get(field);
    return control?.touched && control.invalid;
  }

  getResetFieldError(field: string) {
    const control = this.resetForm.get(field);
    if (control?.errors?.['required']) return 'This field is required';
    if (control?.errors?.['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters`;
    return '';
  }
}
