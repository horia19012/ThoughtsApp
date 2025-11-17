import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: false,
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit{
  isLogin = true;
  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;
  isResetting = false;
  resetMode = false;

  authForm: FormGroup;
  resetForm: FormGroup;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.authForm = this.createAuthForm();
    this.resetForm = this.createResetForm();
  }
  ngOnInit() {
    localStorage.clear();
  }

  /** Create the main auth form */
  private createAuthForm(): FormGroup {
    return this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      email: [''],
      confirmPassword: ['']
    });
  }

  /** Create reset password form */
  private createResetForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /** Toggle Login/Register mode */
  switchMode(): void {
    this.isLogin = !this.isLogin;
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.errorMessage='';

    // Reset the form completely
    this.authForm.reset();
    this.updateValidators();
  }

  /** Update validators depending on mode */
  private updateValidators(): void {
    if (this.isLogin) {
      this.authForm.get('email')?.clearValidators();
      this.authForm.get('confirmPassword')?.clearValidators();
    } else {
      this.authForm.get('email')?.setValidators([Validators.required, Validators.email]);
      this.authForm.get('confirmPassword')?.setValidators([
        Validators.required,
        this.passwordMatchValidator.bind(this)
      ]);
    }

    // Always update validity
    ['username', 'password', 'email', 'confirmPassword'].forEach(field => {
      this.authForm.get(field)?.updateValueAndValidity();
    });
  }

  /** Password match validator */
  private passwordMatchValidator(control: any) {
    const password = this.authForm.get('password')?.value;
    return password === control.value ? null : {passwordMismatch: true};
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /** Submit Login/Register */
  onSubmit(): void {
    if (!this.isSubmitting && this.authForm.valid) {
      this.isSubmitting = true;
      const formData = this.authForm.value;

      if (this.isLogin) {
        this.authService.login(formData.username, formData.password).subscribe({
          next: (res) => {
            console.log('Login successful:', res);
            this.isSubmitting = false;
            if (res && res.token) {
              localStorage.setItem('token', res.token);
              localStorage.setItem('user_id',res.id);
            }
            this.router.navigate(['/voice-message'])
          },
          error: (err) => {
            console.error('Login failed:', err);
            this.errorMessage = 'Invalid username or password.';
            this.isSubmitting = false;
          }
        });
      } else {
        this.authService.register(
          formData.username,
          formData.email,
          formData.password,
          'USER'
        ).subscribe({
          next: (res) => {
            console.log('Registration successful:', res);
            this.isSubmitting = false;
          },
          error: (err) => {
            console.error('Registration failed:', err);
            this.errorMessage = 'Registration failed. Please try again.';
            this.isSubmitting = false;
          }
        });
      }
    } else {
      this.authForm.markAllAsTouched();
    }
  }

  /** Go to reset password mode */
  goToReset(): void {
    this.resetMode = true;
    this.isResetting = false;
    this.resetForm.reset();
  }

  /** Reset password */
  onResetPassword(): void {
    if (this.resetForm.valid && !this.isResetting) {
      this.isResetting = true;
      const email = this.resetForm.get('email')!.value;

      this.authService.resetPassword(email).subscribe({
        next: () => {
          alert('Password reset email sent!');
          this.isResetting = false;
          this.resetMode = false;
        },
        error: () => {
          alert('Error sending reset email.');
          this.isResetting = false;
        }
      });
    } else {
      this.resetForm.markAllAsTouched();
    }
  }

  /** Field validators */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.authForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.authForm.get(fieldName);
    if (!field || !field.errors) return '';
    if (field.errors['required']) return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    if (field.errors['email']) return 'Please enter a valid email address';
    if (field.errors['minlength']) return `Password must be at least ${field.errors['minlength'].requiredLength} characters`;
    if (field.errors['passwordMismatch']) return 'Passwords do not match';
    return '';
  }

  /** Reset password field validators */
  isResetFieldInvalid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getResetFieldError(fieldName: string): string {
    const field = this.resetForm.get(fieldName);
    if (!field || !field.errors) return '';
    if (field.errors['required']) return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    if (field.errors['email']) return 'Please enter a valid email address';
    return '';
  }
}
