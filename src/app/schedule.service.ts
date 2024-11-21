import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ScheduleResponse } from './interfaces/pagerduty-schedule';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  private apiUrl = 'https://api.pagerduty.com/schedules/'; 

  constructor(private http: HttpClient) { }

  getSchedule(token: string, fromDate: string, toDate: string, id: string): Observable<ScheduleResponse> {
    const headers = new HttpHeaders()
      .set('Authorization', `Token token=${token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    const params = {
      since: fromDate,
      until: toDate      
    };
    
    return this.http.get<ScheduleResponse>(this.apiUrl + id, { headers, params });
  }

  listschedules(token: string, query: string, limit: number): Observable<any> {
    const headers = new HttpHeaders()
      .set('Authorization', `Token token=${token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    const params = {
      query: query,
      limit: limit
    };
    
    return this.http.get(this.apiUrl, { headers, params });
  }
}
