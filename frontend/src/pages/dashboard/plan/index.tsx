import { useState } from 'react';
import { useAvailablePlans, useSubscribeToPlan, useUsage } from '@/query/auth.query';

export default function UserPlanPage() {
  const { data: usageData, isLoading } = useUsage();
  const { data: availablePlans = [] } = useAvailablePlans();
  const { mutate: subscribe, isPending: isSubscribing } = useSubscribeToPlan();
  const [showComingSoon, setShowComingSoon] = useState(false);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading current plan...</div>;
  }

  const plan = usageData?.plan;
  const limits = usageData?.limits;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold">My Subscription Plan</h1>
          <p className="text-sm text-muted-foreground mt-1">View your current plan and active usage limits.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="text-lg font-bold">{plan?.name || 'Free Plan'}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {plan ? `$${plan.price}/${plan.interval}` : 'No paid plan is currently assigned.'}
        </p>
        <p className="text-sm text-primary font-semibold mt-2">
          Limits renew on:{' '}
          {usageData?.usage?.billingPeriodEnd
            ? new Date(usageData.usage.billingPeriodEnd).toLocaleString()
            : 'Not available'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <h3 className="font-bold text-sm">SEO Limits</h3>
          <p className="text-sm">Webpage Audits: {limits?.seo?.webpageAnalysisUsed ?? 0} / {limits?.seo?.webpageAnalysisLimit ?? 0}</p>
          <p className="text-sm">Max Kept History: {limits?.seo?.maxHistoryCount ?? 0}</p>
          <p className="text-sm">Download Report: {limits?.seo?.downloadReport ? 'Enabled' : 'Disabled'}</p>
          <p className="text-sm">Page Speed Calculation: {limits?.seo?.pageSpeedAndLoadtime ? 'Enabled' : 'Disabled'}</p>
          <p className="text-sm">AI Suggestions: {limits?.seo?.aiFixSuggestion ? 'Enabled' : 'Disabled'}</p>
          <p className="text-sm">WhatsApp Sharing: {limits?.seo?.whatsappIntegration ? 'Enabled' : 'Disabled'}</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <h3 className="font-bold text-sm">Lead Generation Limits</h3>
          <p className="text-sm">Page Scrapes: {limits?.leadGen?.pageScrapesUsed ?? 0} / {limits?.leadGen?.pageScrapeLimit ?? 0}</p>
          <p className="text-sm">Load More Restriction: {limits?.leadGen?.totalLeadInOneExecutionLimit ?? 0}</p>
          <p className="text-sm">Custom Templates Limit: {limits?.leadGen?.messageTemplateCreationLimit ?? 0}</p>
          <p className="text-sm">Message Inbox Access: {limits?.leadGen?.messagePortalAccess ? 'Enabled' : 'Disabled'}</p>
          <p className="text-sm">CSV Report Export: {limits?.leadGen?.reportExportFeature ? 'Enabled' : 'Disabled'}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-bold">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availablePlans.map((p) => {
            const isCurrent = plan?.id === p.id;
            return (
              <div key={p.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold">{p.name}</h4>
                    {isCurrent && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">${p.price}/{p.interval}</p>
                </div>
                <button
                  disabled={isCurrent || isSubscribing}
                  onClick={() => {
                    if (p.price === 0) {
                      subscribe(p.id);
                      return;
                    }
                    setShowComingSoon(true);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-semibold ${
                    isCurrent || isSubscribing
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:brightness-110'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : p.price === 0 ? 'Activate Plan' : 'Buy Now'}
                </button>
                <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-2">
                  <p>Webpages Audit Limit: {p.metrics?.webpageAnalysisLimit ?? 0}</p>
                  <p>Max Kept History: {p.metrics?.maxHistoryCount ?? 0}</p>
                  <p>Enable Download Report: {p.metrics?.downloadReport ? 'Yes' : 'No'}</p>
                  <p>Enable Page Speed Calculation: {p.metrics?.pageSpeedAndLoadtime ? 'Yes' : 'No'}</p>
                  <p>Enable AI Suggestions: {p.metrics?.aiFixSuggestion ? 'Yes' : 'No'}</p>
                  <p>Enable WhatsApp Sharing: {p.metrics?.whatsappIntegration ? 'Yes' : 'No'}</p>
                  <p>Page Scrapes Limit: {p.metrics?.pageScrapeLimit ?? 0}</p>
                  <p>Load More restriction: {p.metrics?.totalLeadInOneExecutionLimit ?? 0}</p>
                  <p>Custom Templates Limit: {p.metrics?.messageTemplateCreationLimit ?? 0}</p>
                  <p>Enable Message Inbox Portal Access: {p.metrics?.messagePortalAccess ? 'Yes' : 'No'}</p>
                  <p>Enable CSV Report Export Feature: {p.metrics?.reportExportFeature ? 'Yes' : 'No'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showComingSoon && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-xl">
            <h4 className="text-lg font-bold">Coming Soon</h4>
            <p className="text-sm text-muted-foreground mt-2">
              Plan purchase is coming soon. Please contact support for upgrades right now.
            </p>
            <div className="flex justify-end mt-5">
              <button
                onClick={() => setShowComingSoon(false)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
