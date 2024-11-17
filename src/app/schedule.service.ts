import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  private apiUrl = 'https://api.pagerduty.com/schedules/'; 

  constructor(private http: HttpClient) { }

  getSchedules(token: string, fromDate: string, toDate: string, id: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Token token=${token}`);
    headers.set('Content-Type', 'application/json')
    headers.set('Accept', 'application/json')

    const params = {
      since: fromDate,
      until: toDate      
    };
    
    return this.http.get(this.apiUrl + id, { headers, params });
  }
}
