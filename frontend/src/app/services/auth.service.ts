import {Injectable} from '@angular/core';
import {environment} from '../../enviroment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, {username, password});
  }

  register(username: string, email: string, password: string, role: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, {username, email, password, role});
  }

  resetPassword(email: string) {
    const params = new HttpParams().set('email', email);
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, null, { params });
  }

  setNewPassword(data: { newPassword: any; token: string | null }) {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, data);
  }

}
