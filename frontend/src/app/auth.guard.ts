import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {catchError, map, Observable, of} from 'rxjs';
import {environment} from '../enviroment';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private apiUrl = environment.apiUrl;
  constructor(private router: Router, private http: HttpClient) {
  }

  canActivate(): Observable<boolean> {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['']);
      return of(false);
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.apiUrl}/auth/validate-token`, {headers}).pipe(
      map(() => true),
      catchError(() => {
        this.router.navigate(['']);
        return of(false);
      })
    );
  }
}
