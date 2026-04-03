import { Badge } from '@/components/ui/badge';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbType {
	sections: { label: string; ref: string }[];
}

const BreadCrumb = ({ sections }: BreadcrumbType) => {
	return (
		<Breadcrumb>
			<BreadcrumbList>
				{sections.map((section, i) => (
					<BreadcrumbItem key={section.label}>
						<BreadcrumbLink href={section.ref}>
							<Badge
								variant='outline'
								className={
									i + 1 === sections.length
										? 'border-primary text-primary'
										: 'text-muted-foreground hover:text-foreground'
								}
							>
								{section.label}
							</Badge>
						</BreadcrumbLink>
						{i + 1 === sections.length ? null : <BreadcrumbSeparator />}
					</BreadcrumbItem>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
};

export default BreadCrumb;
