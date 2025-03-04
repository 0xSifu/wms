import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { ProductQuickActions } from './_components/QuickActions';
import { Button } from '@/components/ui/button';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Products', link: '/dashboard/products' }
];
export default async function Page() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <Heading title="Products" description="Manage your products" />
          {/* <ProductQuickActions>
            <Button>Quick Menu</Button>
          </ProductQuickActions> */}
        </div>
        <Separator />
      </div>
    </PageContainer>
  );
}
