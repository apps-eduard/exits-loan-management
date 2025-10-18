import { Request, Response } from 'express';
import { TenantService } from '../services/tenant.service';

export class TenantController {
  private tenantService: TenantService;

  constructor() {
    this.tenantService = new TenantService();
  }

  /**
   * Public tenant registration (no authentication required)
   */
  registerTenant = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantData = req.body;
      
      // Validate required fields
      if (!tenantData.company_name || !tenantData.contact_email || !tenantData.admin_password) {
        res.status(400).json({ 
          error: 'Missing required fields: company_name, contact_email, admin_password' 
        });
        return;
      }

      // Create tenant with admin user
      const tenant = await this.tenantService.createTenant(tenantData);
      
      res.status(201).json({
        success: true,
        message: 'Tenant registered successfully. Please log in with your credentials.',
        data: {
          tenant_id: tenant.id,
          company_name: tenant.company_name,
          slug: tenant.slug,
          contact_email: tenant.contact_email
        }
      });
    } catch (error: any) {
      console.error('Error registering tenant:', error);
      
      // Check for duplicate slug or email
      if (error.code === '23505') {
        res.status(409).json({ 
          error: 'A tenant with this company name or email already exists' 
        });
        return;
      }
      
      res.status(500).json({ 
        error: 'Failed to register tenant. Please try again.' 
      });
    }
  };

  /**
   * Get all tenants (Super Admin only)
   */
  getAllTenants = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenants = await this.tenantService.getAllTenants();
      res.json(tenants);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      res.status(500).json({ error: 'Failed to fetch tenants' });
    }
  };

  /**
   * Get tenant by ID (Super Admin or tenant's own admin)
   */
  getTenantById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Regular admins can only view their own tenant
      if (!req.isSuperAdmin && req.tenantId !== id) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const tenant = await this.tenantService.getTenantById(id);
      
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }

      res.json(tenant);
    } catch (error) {
      console.error('Error fetching tenant:', error);
      res.status(500).json({ error: 'Failed to fetch tenant' });
    }
  };

  /**
   * Create new tenant (Super Admin only)
   */
  createTenant = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantData = req.body;
      const tenant = await this.tenantService.createTenant(tenantData);
      res.status(201).json(tenant);
    } catch (error) {
      console.error('Error creating tenant:', error);
      res.status(500).json({ error: 'Failed to create tenant' });
    }
  };

  /**
   * Update tenant (Super Admin or tenant's own admin)
   */
  updateTenant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Regular admins can only update their own tenant
      if (!req.isSuperAdmin && req.tenantId !== id) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Regular admins can't change subscription or status
      if (!req.isSuperAdmin) {
        delete updates.subscription_plan;
        delete updates.status;
        delete updates.trial_ends_at;
      }

      const tenant = await this.tenantService.updateTenant(id, updates);
      
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }

      res.json(tenant);
    } catch (error) {
      console.error('Error updating tenant:', error);
      res.status(500).json({ error: 'Failed to update tenant' });
    }
  };

  /**
   * Delete tenant (Super Admin only)
   */
  deleteTenant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const success = await this.tenantService.deleteTenant(id);
      
      if (!success) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      res.status(500).json({ error: 'Failed to delete tenant' });
    }
  };

  /**
   * Get tenant statistics (Super Admin or tenant's own admin)
   */
  getTenantStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Regular admins can only view their own tenant stats
      if (!req.isSuperAdmin && req.tenantId !== id) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const stats = await this.tenantService.getTenantStats(id);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching tenant stats:', error);
      res.status(500).json({ error: 'Failed to fetch tenant stats' });
    }
  };

  /**
   * Get current tenant (from JWT)
   */
  getCurrentTenant = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'No tenant context found' });
        return;
      }

      const tenant = await this.tenantService.getTenantById(req.tenantId);
      
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }

      res.json(tenant);
    } catch (error) {
      console.error('Error fetching current tenant:', error);
      res.status(500).json({ error: 'Failed to fetch current tenant' });
    }
  };
}
