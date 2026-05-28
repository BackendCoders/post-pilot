import React, { useState, useEffect } from 'react';
import { api } from '@/service/api';
import { 
  Users, 
  Settings, 
  Search, 
  Edit3, 
  Plus, 
  Trash2, 
  Calendar, 
  Check, 
  X, 
  BarChart3,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { toast } from 'sonner';

interface UserUsage {
  seoWebpageAnalysisCount: number;
  seoPageSpeedCount: number;
  leadGenTemplatesCreated: number;
  leadGenPagesScraped: number;
  leadGenLeadsScraped: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
}

interface AdminUser {
  id: string;
  userName: string;
  email: string;
  role: string;
  isActive: boolean;
  phoneNumber?: string;
  companyName?: string;
  companySize?: string;
  jobTitle?: string;
  website?: string;
  lastLogin?: string;
  createdAt: string;
  pricingModel?: any;
  leaseUntil?: string;
  usage: UserUsage;
}

interface MetricConfig {
  webpageAnalysisLimit: number;
  downloadReport: boolean;
  trackHistory: boolean;
  maxHistoryCount: number;
  pageSpeedAndLoadtime: boolean;
  aiFixSuggestion: boolean;
  whatsappIntegration: boolean;
  messageTemplateCreationLimit: number;
  systemMessageTemplateUpdateLimit: boolean;
  messageTemplateAccessLimit: boolean;
  messagePortalAccess: boolean;
  pageScrapeLimit: number;
  totalLeadInOneExecutionLimit: number;
  reportExportFeature: boolean;
}

interface PricingPlan {
  _id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  isDefault: boolean;
  isLease: boolean;
  metrics: MetricConfig;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'users' | 'plans' | 'analytics'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals / Drawer states
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isAssignPlanOpen, setIsAssignPlanOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  
  // Plan form states
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  
  // Assign plan forms
  const [targetPlanId, setTargetPlanId] = useState('');
  const [isLeaseAssign, setIsLeaseAssign] = useState(false);
  const [leaseUntilAssign, setLeaseUntilAssign] = useState('');

  // User edit forms
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState('');
  const [editUserActive, setEditUserActive] = useState(true);

  // New plan / Edit plan fields
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState(0);
  const [planInterval, setPlanInterval] = useState<'month' | 'year'>('month');
  const [planIsDefault, setPlanIsDefault] = useState(false);
  const [planIsLease, setPlanIsLease] = useState(false);
  const [planMetrics, setPlanMetrics] = useState<MetricConfig>({
    webpageAnalysisLimit: 0,
    downloadReport: false,
    trackHistory: false,
    maxHistoryCount: 0,
    pageSpeedAndLoadtime: false,
    aiFixSuggestion: false,
    whatsappIntegration: false,
    messageTemplateCreationLimit: 0,
    systemMessageTemplateUpdateLimit: false,
    messageTemplateAccessLimit: false,
    messagePortalAccess: false,
    pageScrapeLimit: 0,
    totalLeadInOneExecutionLimit: 0,
    reportExportFeature: false,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, plansRes] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/admin/plans')
      ]);
      setUsers(usersRes.data.data || []);
      setPlans(plansRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load admin data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await api.put(`/api/admin/users/${selectedUser.id}`, {
        userName: editUserName,
        email: editUserEmail,
        role: editUserRole,
        isActive: editUserActive
      });
      toast.success('User updated successfully');
      setIsEditUserOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleAssignPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await api.put(`/api/admin/users/${selectedUser.id}/assign-plan`, {
        pricingModelId: targetPlanId || null,
        isLease: isLeaseAssign,
        leaseUntil: isLeaseAssign ? leaseUntilAssign : undefined
      });
      toast.success('Subscription plan updated successfully');
      setIsAssignPlanOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to assign subscription');
    }
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: planName,
        price: Number(planPrice),
        interval: planInterval,
        isDefault: planIsDefault,
        isLease: planIsLease,
        metrics: planMetrics
      };

      if (selectedPlan) {
        await api.put(`/api/admin/plans/${selectedPlan._id}`, payload);
        toast.success('Pricing model updated successfully');
      } else {
        await api.post('/api/admin/plans', payload);
        toast.success('Pricing model created successfully');
      }
      setIsPlanModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save plan');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing model?')) return;
    try {
      await api.delete(`/api/admin/plans/${id}`);
      toast.success('Pricing plan deleted successfully');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete plan');
    }
  };

  const openEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditUserName(user.userName);
    setEditUserEmail(user.email);
    setEditUserRole(user.role);
    setEditUserActive(user.isActive);
    setIsEditUserOpen(true);
  };

  const openAssignPlan = (user: AdminUser) => {
    setSelectedUser(user);
    setTargetPlanId(user.pricingModel?._id || '');
    setIsLeaseAssign(!!user.leaseUntil);
    setLeaseUntilAssign(
      user.leaseUntil 
        ? new Date(user.leaseUntil).toISOString().split('T')[0] 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    setIsAssignPlanOpen(true);
  };

  const openCreatePlan = () => {
    setSelectedPlan(null);
    setPlanName('');
    setPlanPrice(0);
    setPlanInterval('month');
    setPlanIsDefault(false);
    setPlanIsLease(false);
    setPlanMetrics({
      webpageAnalysisLimit: 10,
      downloadReport: false,
      trackHistory: true,
      maxHistoryCount: 10,
      pageSpeedAndLoadtime: false,
      aiFixSuggestion: false,
      whatsappIntegration: false,
      messageTemplateCreationLimit: 5,
      systemMessageTemplateUpdateLimit: false,
      messageTemplateAccessLimit: false,
      messagePortalAccess: false,
      pageScrapeLimit: 5,
      totalLeadInOneExecutionLimit: 10,
      reportExportFeature: false,
    });
    setIsPlanModalOpen(true);
  };

  const openEditPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setPlanName(plan.name);
    setPlanPrice(plan.price);
    setPlanInterval(plan.interval);
    setPlanIsDefault(plan.isDefault);
    setPlanIsLease(plan.isLease);
    setPlanMetrics({ ...plan.metrics });
    setIsPlanModalOpen(true);
  };

  const filteredUsers = users.filter(user => 
    user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Admin Workspace</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage users, assign manual lease periods, track active usage metrics, and edit subscription pricing parameters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'plans' && (
            <button
              onClick={openCreatePlan}
              className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md"
            >
              <Plus size={16} /> Create Plan
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users size={16} /> Users Management
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'plans'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings size={16} /> Subscription Plans
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'analytics'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 size={16} /> Platform Metrics
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* TAB 1: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative group max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all" />
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all"
                />
              </div>

              {/* High density users table */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Status & Role</th>
                        <th className="px-6 py-4">Subscription Plan</th>
                        <th className="px-6 py-4">Active Cycle Usage</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredUsers.map((user) => {
                        const webpageLimit = user.pricingModel?.metrics?.webpageAnalysisLimit || 0;
                        const scrapeLimit = user.pricingModel?.metrics?.pageScrapeLimit || 0;
                        
                        const webpagePct = webpageLimit > 0 ? Math.min(100, Math.round((user.usage.seoWebpageAnalysisCount / webpageLimit) * 100)) : 0;
                        const scrapePct = scrapeLimit > 0 ? Math.min(100, Math.round((user.usage.leadGenPagesScraped / scrapeLimit) * 100)) : 0;

                        return (
                          <tr key={user.id} className="hover:bg-muted/30 transition-all">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                                  {user.userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-foreground">{user.userName}</span>
                                  <span className="text-xs text-muted-foreground">{user.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold tracking-tight ${
                                  user.isActive 
                                    ? 'bg-emerald-500/10 text-emerald-500' 
                                    : 'bg-rose-500/10 text-rose-500'
                                }`}>
                                  {user.isActive ? 'Active' : 'Deactivated'}
                                </span>
                                <span className="bg-muted px-2 py-0.5 rounded-full text-[11px] font-bold text-muted-foreground uppercase">
                                  {user.role}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-primary">
                                  {user.pricingModel?.name || 'Free Plan'}
                                </span>
                                {user.leaseUntil && (
                                  <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1 mt-1">
                                    <Calendar size={10} /> Lease ends {new Date(user.leaseUntil).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-2 max-w-[200px]">
                                {/* SEO Audits */}
                                <div>
                                  <div className="flex justify-between text-[11px] text-muted-foreground">
                                    <span>SEO Audits</span>
                                    <span>{user.usage.seoWebpageAnalysisCount}/{webpageLimit}</span>
                                  </div>
                                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-0.5">
                                    <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${webpagePct}%` }}></div>
                                  </div>
                                </div>
                                {/* Scrapes */}
                                <div>
                                  <div className="flex justify-between text-[11px] text-muted-foreground">
                                    <span>Pages Scraped</span>
                                    <span>{user.usage.leadGenPagesScraped}/{scrapeLimit}</span>
                                  </div>
                                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-0.5">
                                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${scrapePct}%` }}></div>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openAssignPlan(user)}
                                  className="text-xs font-semibold px-2.5 py-1.5 border border-border hover:bg-muted text-foreground rounded-lg transition-all active:scale-95 flex items-center gap-1"
                                >
                                  <Sliders size={12} /> Assign Plan
                                </button>
                                <button
                                  onClick={() => openEditUser(user)}
                                  className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-all active:scale-95"
                                  title="Edit User"
                                >
                                  <Edit3 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLANS */}
          {activeTab === 'plans' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div key={plan._id} className="bg-card border border-border rounded-2xl p-6 relative flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                          {plan.name}
                          {plan.isDefault && (
                            <span className="bg-blue-500/10 text-blue-500 text-[10px] px-2 py-0.5 rounded-full font-bold">Default</span>
                          )}
                          {plan.isLease && (
                            <span className="bg-amber-500/10 text-amber-500 text-[10px] px-2 py-0.5 rounded-full font-bold">Lease</span>
                          )}
                        </h3>
                        <p className="text-3xl font-extrabold text-foreground mt-2">
                          ${plan.price}
                          <span className="text-xs text-muted-foreground font-semibold">/{plan.interval}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditPlan(plan)}
                          className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-all"
                          title="Edit metrics configuration"
                        >
                          <Edit3 size={14} />
                        </button>
                        {!plan.isDefault && !plan.isLease && (
                          <button
                            onClick={() => handleDeletePlan(plan._id)}
                            className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-all"
                            title="Delete Plan"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 space-y-3">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SEO Limits</div>
                      <ul className="space-y-2 text-xs text-foreground">
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Webpage limit:</span>
                          <span className="font-bold">{plan.metrics.webpageAnalysisLimit} pages</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Download SEO report:</span>
                          <span className="font-bold flex items-center">{plan.metrics.downloadReport ? <Check size={12} className="text-emerald-500" /> : <X size={12} className="text-rose-500" />}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Page speed calc:</span>
                          <span className="font-bold flex items-center">{plan.metrics.pageSpeedAndLoadtime ? <Check size={12} className="text-emerald-500" /> : <X size={12} className="text-rose-500" />}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">AI Fix suggestions:</span>
                          <span className="font-bold flex items-center">{plan.metrics.aiFixSuggestion ? <Check size={12} className="text-emerald-500" /> : <X size={12} className="text-rose-500" />}</span>
                        </li>
                      </ul>

                      <div className="border-t border-border/60 my-2"></div>

                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lead Gen Limits</div>
                      <ul className="space-y-2 text-xs text-foreground">
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Scrape Page limit:</span>
                          <span className="font-bold">{plan.metrics.pageScrapeLimit} pages</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Execution / Load more:</span>
                          <span className="font-bold">{plan.metrics.totalLeadInOneExecutionLimit} leads</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Custom templates:</span>
                          <span className="font-bold">{plan.metrics.messageTemplateCreationLimit} allowed</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Inbox Portal Access:</span>
                          <span className="font-bold flex items-center">{plan.metrics.messagePortalAccess ? <Check size={12} className="text-emerald-500" /> : <X size={12} className="text-rose-500" />}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: PLATFORM METRICS */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center">
                  <Users size={24} />
                </div>
                <div>
                  <div className="text-2xl font-black text-foreground">{users.length}</div>
                  <div className="text-xs text-muted-foreground font-semibold">Total Registered Users</div>
                </div>
              </div>
              <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <div className="text-2xl font-black text-foreground">
                    {users.reduce((acc, curr) => acc + (curr.usage.leadGenLeadsScraped || 0), 0)}
                  </div>
                  <div className="text-xs text-muted-foreground font-semibold">Leads Scraped This Month</div>
                </div>
              </div>
              <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <div className="text-2xl font-black text-foreground">
                    {users.reduce((acc, curr) => acc + (curr.usage.seoWebpageAnalysisCount || 0), 0)}
                  </div>
                  <div className="text-xs text-muted-foreground font-semibold">SEO Audits Performed</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: ASSIGN PLAN */}
      {isAssignPlanOpen && selectedUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-foreground">Assign Subscription Plan</h3>
              <button onClick={() => setIsAssignPlanOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAssignPlanSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Select Plan</label>
                <select
                  value={targetPlanId}
                  onChange={(e) => setTargetPlanId(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl p-2 text-sm outline-none"
                >
                  <option value="">No Active Plan (Free Default)</option>
                  {plans.map(plan => (
                    <option key={plan._id} value={plan._id}>{plan.name} (${plan.price}/{plan.interval})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isLease"
                  checked={isLeaseAssign}
                  onChange={(e) => setIsLeaseAssign(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary/20"
                />
                <label htmlFor="isLease" className="text-sm font-semibold text-foreground">Designate as Lease plan</label>
              </div>

              {isLeaseAssign && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase block mb-1 font-semibold">Lease Ends Date</label>
                  <input
                    type="date"
                    value={leaseUntilAssign}
                    onChange={(e) => setLeaseUntilAssign(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl p-2 text-sm outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAssignPlanOpen(false)}
                  className="text-xs font-semibold px-4 py-2 border border-border hover:bg-muted text-foreground rounded-lg active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-semibold px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-md"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {isEditUserOpen && selectedUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-foreground">Edit User Details</h3>
              <button onClick={() => setIsEditUserOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Username</label>
                <input
                  type="text"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl p-2.5 text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Email Address</label>
                <input
                  type="email"
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl p-2.5 text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">User Role</label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl p-2.5 text-sm outline-none"
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editUserActive"
                  checked={editUserActive}
                  onChange={(e) => setEditUserActive(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary/20"
                />
                <label htmlFor="editUserActive" className="text-sm font-semibold text-foreground">Account Status: Active</label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditUserOpen(false)}
                  className="text-xs font-semibold px-4 py-2 border border-border hover:bg-muted text-foreground rounded-lg active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-semibold px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PLAN EDITOR */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl p-6 shadow-xl my-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-foreground">
                {selectedPlan ? `Configure Plan: ${selectedPlan.name}` : 'Create New Plan'}
              </h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handlePlanSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl p-2 text-sm outline-none"
                    placeholder="Premium"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Price ($USD)</label>
                  <input
                    type="number"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(Number(e.target.value))}
                    className="w-full bg-muted border border-border rounded-xl p-2 text-sm outline-none"
                    placeholder="49"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="planIsDefault"
                    checked={planIsDefault}
                    onChange={(e) => setPlanIsDefault(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary/20"
                  />
                  <label htmlFor="planIsDefault" className="text-sm font-semibold text-foreground">Is Default</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="planIsLease"
                    checked={planIsLease}
                    onChange={(e) => setPlanIsLease(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary/20"
                  />
                  <label htmlFor="planIsLease" className="text-sm font-semibold text-foreground">Is Lease</label>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">SEO Feature Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-muted-foreground font-semibold">Webpages Audit Limit</label>
                    <input
                      type="number"
                      value={planMetrics.webpageAnalysisLimit}
                      onChange={(e) => setPlanMetrics({ ...planMetrics, webpageAnalysisLimit: Number(e.target.value) })}
                      className="w-full bg-muted border border-border rounded-xl p-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground font-semibold">Max Kept History</label>
                    <input
                      type="number"
                      value={planMetrics.maxHistoryCount}
                      onChange={(e) => setPlanMetrics({ ...planMetrics, maxHistoryCount: Number(e.target.value) })}
                      className="w-full bg-muted border border-border rounded-xl p-2 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={planMetrics.downloadReport}
                      onChange={(e) => setPlanMetrics({ ...planMetrics, downloadReport: e.target.checked })}
                      className="rounded border-border"
                    /> Enable Download Report
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={planMetrics.pageSpeedAndLoadtime}
                      onChange={(e) => setPlanMetrics({ ...planMetrics, pageSpeedAndLoadtime: e.target.checked })}
                      className="rounded border-border"
                    /> Enable Page Speed Calculation
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={planMetrics.aiFixSuggestion}
                      onChange={(e) => setPlanMetrics({ ...planMetrics, aiFixSuggestion: e.target.checked })}
                      className="rounded border-border"
                    /> Enable AI Suggestions
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={planMetrics.whatsappIntegration}
                      onChange={(e) => setPlanMetrics({ ...planMetrics, whatsappIntegration: e.target.checked })}
                      className="rounded border-border"
                    /> Enable WhatsApp Sharing
                  </label>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Lead Generation Feature Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-muted-foreground font-semibold">Page Scrapes Limit</label>
                    <input
                      type="number"
                      value={planMetrics.pageScrapeLimit}
                      onChange={(e) => setPlanMetrics({ ...planMetrics, pageScrapeLimit: Number(e.target.value) })}
                      className="w-full bg-muted border border-border rounded-xl p-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground font-semibold">Load More restriction (execution limit)</label>
                    <input
                      type="number"
                      value={planMetrics.totalLeadInOneExecutionLimit}
                      onChange={(e) => setPlanMetrics({ ...planMetrics, totalLeadInOneExecutionLimit: Number(e.target.value) })}
                      className="w-full bg-muted border border-border rounded-xl p-2 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-muted-foreground font-semibold">Custom Templates Limit</label>
                    <input
                      type="number"
                      value={planMetrics.messageTemplateCreationLimit}
                      onChange={(e) => setPlanMetrics({ ...planMetrics, messageTemplateCreationLimit: Number(e.target.value) })}
                      className="w-full bg-muted border border-border rounded-xl p-2 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={planMetrics.messagePortalAccess}
                      onChange={(e) => setPlanMetrics({ ...planMetrics, messagePortalAccess: e.target.checked })}
                      className="rounded border-border"
                    /> Enable Message Inbox Portal Access
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={planMetrics.reportExportFeature}
                      onChange={(e) => setPlanMetrics({ ...planMetrics, reportExportFeature: e.target.checked })}
                      className="rounded border-border"
                    /> Enable CSV Report Export Feature
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="text-xs font-semibold px-4 py-2 border border-border hover:bg-muted text-foreground rounded-lg active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-semibold px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-md"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
