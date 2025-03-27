// src/app/layout/layout.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { UserRightsService } from '../../services/user-rights.service';
import { Subscription } from 'rxjs';

interface MenuItem {
  title: string;
  icon: string;
  children?: { name: string; route: string; icon: string}[];
  isOpen?: boolean;
  route?: string;
}

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {
  isCollapsed = true;
  username: string | null = null;
  private subscriptions: Subscription = new Subscription();
  hoverExpand = false;
  
  private allMenuItems: MenuItem[] = [
    { 
      title: 'Fleet', 
      icon: 'info-circle', 
      children: [
        { name: 'Dashboard', route: '/landing', icon: 'dashboard' },
        { name: 'KPIs', route: '/fleet/kpis', icon: 'line-chart' },
        { name: 'Availability Dashboard', route: '/fleet/availability', icon: 'area-chart' },
        { name: 'Events', route: '/fleet/events', icon: 'notification' },
        { name: 'CSEyeQ', route: '/fleet/cseyeq', icon: 'smile' },
        { name: 'Outage Dashboard', route: '/fleet/outage', icon: 'exclamation-circle' },
      ]
    },
    { 
      title: 'Site', 
      icon: 'environment',
      children: [
        { name: 'Overview', route: '/site/overview', icon: 'dashboard' },
        { name: 'CCTV', route: '/site/cctv', icon: 'video-camera' },
        { name: 'Monthly KPIs', route: '/site/monthly-kpis', icon: 'line-chart' },
        { name: 'Equipment Status', route: '/site/equipment-status', icon: 'area-chart' },
        { name: 'Charts', route: '/site/charts', icon: 'bar-chart' },
        { name: 'Custom Charts', route: '/site/custom-charts', icon: 'bar-chart' },
        { name: 'Data Management', route: '/site/data-management', icon: 'database' },
        { name: 'Site Info', route: '/site/site-info', icon: 'info-circle' },
        { name: 'Asset Tree', route: '/site/asset-tree', icon: 'cluster' }
      ]
    },
    { 
      title: 'Operations', 
      icon: 'tool',
      children: [
        { name: 'Work Orders', route: '/operations/work-orders', icon: 'tool' },
        { name: 'Warranty Claims', route: '/operations/warranty-claims', icon: 'file-protect' },
        { name: 'Health and Safety', route: '/operations/health-safety', icon: 'alert' },
        { name: 'Spare Parts - Inventory', route: '/operations/spare-parts/inventory', icon: 'database' },
        { name: 'Spare Parts - History', route: '/operations/spare-parts/history', icon: 'history' },
        { name: 'Logs - Consumables Log', route: '/operations/logs/consumables', icon: 'file-text' },
        { name: 'Logs - Visitors Log', route: '/operations/logs/visitors', icon: 'user' }
      ]
    },
    { 
      title: 'Compliance', 
      icon: 'check',
      children: [
        // { name: 'Compliance Tracker', route: '/compliance/tracker' },
        // { name: 'Obligation Schedule', route: '/compliance/schedule' },
        // { name: 'Activities', route: '/compliance/activities' }
        { name: 'Compliance Tracker', route: '/compliance/tracker', icon: 'check' },
        { name: 'Obligation Schedule', route: '/compliance/schedule', icon: 'calendar' },
        { name: 'Activities', route: '/compliance/activities', icon: 'schedule' }
      ]
    },
    { 
      title: 'Reports', 
      icon: 'file',
      children: [
        // { name: 'Report Generation', route: '/reports/generation' },
        // { name: 'Repository', route: '/reports/repository' },
        // { name: 'Send Reports', route: '/reports/send' },
        // { name: 'System Summary Report', route: '/reports/summary' },
        // { name: 'Availability Report', route: '/reports/availability' }
        { name: 'Report Generation', route: '/reports/generation', icon: 'file' },
        { name: 'Repository', route: '/reports/repository', icon: 'folder' },
        { name: 'Send Reports', route: '/reports/send', icon: 'mail' },
        { name: 'System Summary Report', route: '/reports/summary', icon: 'file-text' },
        { name: 'Availability Report', route: '/reports/availability', icon: 'file-text' }
      ]
    },
    { 
      title: 'Metrics', 
      icon: '',
      children: [
        { name: 'Work Order', route: '/metric/work-order', icon: 'tool' },
      ]
    },
    { 
      title: 'Admin', 
      icon: 'setting',
      children: [
        { name: 'User Management', route: '/admin/user-management', icon: 'user' },
        { name: 'Distribution Lists', route: '/admin/distribution-lists', icon: 'mail' },
        { name: 'Notification Lists', route: '/admin/notification-lists', icon: 'notification' },
        { name: 'Database Tables', route: '/admin/database-tables', icon: 'database'}
      ]
    },
  ];
  
  menuItems: MenuItem[] = [];

  constructor(
    private authService: AuthService,
    public router: Router,
    private userRightsService: UserRightsService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.getDecodedUsername().subscribe(username => {
        this.username = username;
      })
    );
    
    this.subscriptions.add(
      this.userRightsService.userRights$.subscribe(() => {
        this.filterMenuItems();
      })
    );
    
    this.userRightsService.loadCurrentUserRights().subscribe();
    
    this.filterMenuItems();
  }
  
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  filterMenuItems(): void {
    const accessibleSections = this.userRightsService.getAccessibleSections();
    const accessibleModules = this.userRightsService.getAccessibleModules();
 
    this.menuItems = this.allMenuItems
      .filter(item => {
        const hasAccess = accessibleSections.includes(item.title);
        return hasAccess;
      })
      .map(item => {
        const clonedItem = {...item};
        
        if (clonedItem.children) {
          clonedItem.children = clonedItem.children.filter(child => {
            const moduleName = `${item.title} - ${child.name}`;
            const hasAccess = accessibleModules.some(m => m === moduleName);
            return hasAccess;
          });
        }
        
        return clonedItem;
      })
      .filter(item => !item.children || item.children.length > 0);
    
  }

  getUserInitials(): string {
    if (!this.username) return '-';
    return this.username
      .split('.')
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  logout(): void {
    this.authService.logout();
  }

  toggleSidebar(): void {
    // Manual toggle via the trigger button
    this.isCollapsed = !this.isCollapsed;
  }

  onSiderMouseEnter(): void {
    // When the sidebar is collapsed, expand it on hover.
    if (this.isCollapsed) {
      this.hoverExpand = true;
      this.isCollapsed = false;
    }
  }

  onSiderMouseLeave(): void {
    // If it was expanded via hover, revert back to collapsed on mouse leave.
    if (this.hoverExpand) {
      this.isCollapsed = true;
      this.hoverExpand = false;
    }
  }

  onMenuClick(child: { name: string, route: string }): void {
    if (child.route) {
      this.router.navigate([child.route]);
    }
  }

  isMenuItemActive(route: string): boolean {
    return this.router.url === route;
  }
}