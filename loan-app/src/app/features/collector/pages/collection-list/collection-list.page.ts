import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { CollectionService, Collection } from '../../services/collection.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-collection-list',
  templateUrl: './collection-list.page.html',
  styleUrls: ['./collection-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class CollectionListPage implements OnInit {
  collections: Collection[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private collectionService: CollectionService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadCollections();
  }

  ionViewWillEnter() {
    this.loadCollections();
  }

  loadCollections() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.collectionService.getAssignedCollections(user.id).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success) {
          this.collections = response.data.collections || [];
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load collections. Please try again.';
        console.error('Load collections error:', error);
      }
    });
  }

  doRefresh(event: any) {
    this.loadCollections();
    setTimeout(() => event.target.complete(), 1000);
  }

  goToPayment(collection: Collection) {
    this.router.navigate(['/collector/tabs/payment'], {
      queryParams: { loanId: collection.loanId }
    });
  }

  getStatusColor(status: string): string {
    return status === 'overdue' ? 'danger' : 'success';
  }
}
