import {Injectable} from '@angular/core';
import {map, Observable} from 'rxjs';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {environment} from '../../enviroment';

@Injectable({
  providedIn: 'root'
})
export class VoiceMessageService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
  }

  // Helper to get headers with token if available
  private getAuthOptions(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    const headers = token
      ? new HttpHeaders({Authorization: `Bearer ${token}`})
      : new HttpHeaders(); // empty headers instead of undefined

    return {headers};
  }

  uploadVoiceMessage(file: Blob): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, 'voice.wav');

    const userId = localStorage.getItem('user_id') || 'anonymous';
    formData.append('user_id', userId);

    return this.http.post(`${this.apiUrl}/api/voice/upload`, formData, this.getAuthOptions());
  }

  deleteVoiceMessage(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`, this.getAuthOptions());
  }

  getLatestAudioExcluding(excludedUserIds: string[]): Observable<{ userId: string, audioBlob: Blob }> {
    return this.http.post(`${this.apiUrl}/api/voice/latest-audio`,
      {excludedUserIds},
      {responseType: 'blob', observe: 'response', ...this.getAuthOptions()}
    ).pipe(
      map(response => {
        const userId = response.headers.get('X-User-Id') || 'unknown';
        return {userId, audioBlob: response.body as Blob};
      })
    );
  }

  getTodayUsers(): Observable<string[]> {
    const currentUserId = localStorage.getItem('user_id') || 'anonymous';
    return this.http.get<string[]>(`${this.apiUrl}/api/users/today-users?currentUserId=${currentUserId}`, this.getAuthOptions());
  }

  hadRecordedThisHour(userId: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.apiUrl}/api/voice/check-last-hour-audio`,
      {params: {userId}, ...this.getAuthOptions()}
    );
  }

  getTodayListenedOwners(listenerId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/api/voice/listened/${listenerId}/today`,
      {params: {listenerId}, ...this.getAuthOptions()});
  }

  logListenedMessage(listenerUserId: string, messageOwnerUserId: string): Observable<any> {
    const body = {listenerUserId, messageOwnerUserId};
    return this.http.post(`${this.apiUrl}/api/voice/listened`, body, this.getAuthOptions());
  }

  getNextAudio(userId: string): Observable<{ audioUrl: string; userId: string; messageId: string }> {
    return this.http.get<{ audioUrl: string; userId: string; messageId: string }>(
      `${this.apiUrl}/api/voice/next-audio`,
      { ...this.getAuthOptions(), params: { userId } }
    );
  }
}
