import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileItemComponent } from './profile-item.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('ProfileItemComponent', () => {
  let component: ProfileItemComponent;
  let fixture: ComponentFixture<ProfileItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProfileItemComponent,
        RouterTestingModule,
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
