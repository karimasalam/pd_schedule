import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamScheduleExportComponent } from './team-schedule-export.component';

describe('TeamScheduleExportComponent', () => {
  let component: TeamScheduleExportComponent;
  let fixture: ComponentFixture<TeamScheduleExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [TeamScheduleExportComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(TeamScheduleExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
