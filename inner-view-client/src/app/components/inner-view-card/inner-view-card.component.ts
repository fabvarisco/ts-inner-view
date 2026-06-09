import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-inner-view-card',
  templateUrl: './inner-view-card.component.html',
  styleUrls: ['./inner-view-card.component.scss'],
})
export class InnerViewCardComponent  implements OnInit {
  private _name:string;
  private _thumb:string;
  private _decription:string;  

  constructor() { }

  ngOnInit() {}

}
