import { CreditCard, RefreshCw, ShieldCheck, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const featureCards = [
	{
		icon: CreditCard,
		title: 'Carteiras e cartões',
		description:
			'Centralize cartões físicos e carteiras digitais. Cada método poderá ter limites, taxa e bandeira.',
	},
	{
		icon: ShieldCheck,
		title: 'Rastreio seguro',
		description:
			'Todos os lançamentos ficam vinculados ao Supabase com RLS. Histórico completo para auditoria.',
	},
	{
		icon: RefreshCw,
		title: 'Sincronização automática',
		description:
			'Atualize limites e faturas em tempo real assim que novas transações forem registradas.',
	},
]

const roadmap = [
	'Cadastro de bandeiras e bancos com limites dedicados',
	'Definição de cartões padrão para compras específicas',
	'Integração com o fluxo de transações para conciliação automática',
]

export default function PaymentMethodsPage() {
	return (
		<div className="container mx-auto max-w-5xl px-4 py-16">
			<div className="mb-10 flex flex-col gap-4 text-center">
				<div className="flex items-center justify-center gap-2">
					<Badge variant="secondary" className="uppercase">beta</Badge>
					<span className="text-sm font-medium text-muted-foreground">
						Gestão unificada de formas de pagamento
					</span>
				</div>
				<h1 className="text-4xl font-bold">
					Controle seus cartões e carteiras digitais em um só lugar
				</h1>
				<p className="text-lg text-muted-foreground">
					Enquanto finalizamos o CRUD completo, você já pode consultar o planejamento do módulo
					e preparar suas credenciais do Supabase.
				</p>
				<div className="flex flex-wrap items-center justify-center gap-3">
					<Button size="lg" disabled className="gap-2">
						<CreditCard className="h-5 w-5" />
						Cadastrar forma de pagamento
					</Button>
					<Button variant="outline" size="lg" disabled className="gap-2">
						<Zap className="h-5 w-5" />
						Importar faturas (em breve)
					</Button>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				{featureCards.map((feature) => (
					<Card key={feature.title}>
						<CardHeader>
							<div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
								<feature.icon className="h-5 w-5 text-primary" />
							</div>
							<CardTitle>{feature.title}</CardTitle>
							<CardDescription>{feature.description}</CardDescription>
						</CardHeader>
					</Card>
				))}
			</div>

			<div className="mt-10 grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>O que já está pronto</CardTitle>
						<CardDescription>
							Modelagem Supabase, endpoints tipados e componentes básicos preparados para integração.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className="list-disc space-y-3 pl-5 text-sm text-muted-foreground">
							<li>Tipos TypeScript para payment_methods e referências cruzadas</li>
							<li>Hooks reutilizáveis para sincronizar dados em tempo real</li>
							<li>Modais de criação/edição conectados ao design system</li>
						</ul>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Roadmap imediato</CardTitle>
						<CardDescription>Sequência das próximas entregas antes do lançamento público.</CardDescription>
					</CardHeader>
					<CardContent>
						<ol className="list-decimal space-y-3 pl-5 text-sm text-muted-foreground">
							{roadmap.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ol>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
