import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FullScheduleExportComponent } from './full-schedule-export.component';

describe('FullScheduleExportComponent', () => {
  let component: FullScheduleExportComponent;
  let fixture: ComponentFixture<FullScheduleExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FullScheduleExportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FullScheduleExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
