import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile, UserUpload, FavoriteItem } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  getUser(): Observable<UserProfile> {
    return this.http.get<UserProfile>('/assets/mock/mockUser.json');
  }

  getUserUploads(): Observable<UserUpload[]> {
    return this.http.get<UserUpload[]>('/assets/mock/mockUserUploads.json');
  }

  getFavorites(): Observable<FavoriteItem[]> {
    return this.http.get<FavoriteItem[]>('/assets/mock/mockFavorites.json');
  }
}
