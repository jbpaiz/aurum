WITH default_categories (name, type, color) AS (
	VALUES
		-- Categorias de receita
		('Salário', 'income', '#10b981'),
		('Freelance', 'income', '#059669'),
		('Investimentos', 'income', '#047857'),
		('Vendas', 'income', '#065f46'),
		('Outros', 'income', '#064e3b'),

		-- Categorias de despesa
		('Alimentação', 'expense', '#ef4444'),
		('Transporte', 'expense', '#dc2626'),
		('Moradia', 'expense', '#b91c1c'),
		('Saúde', 'expense', '#991b1b'),
		('Educação', 'expense', '#7f1d1d'),
		('Lazer', 'expense', '#6b0f14'),
		('Compras', 'expense', '#590a12'),
		('Outros', 'expense', '#450a0a')
)
INSERT INTO categories (name, type, color)
SELECT dc.name, dc.type, dc.color
FROM default_categories dc
WHERE NOT EXISTS (
	SELECT 1 FROM categories c
	WHERE c.name = dc.name
	  AND c.type = dc.type
	  AND c.user_id IS NULL
);

DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'transactions' AND column_name = 'category'
	) THEN
		INSERT INTO transactions (user_id, type, amount, description, category, date) VALUES 
		('demo-user', 'income', 5000.00, 'Salário do mês', 'Salário', CURRENT_DATE - INTERVAL '1 day'),
		('demo-user', 'expense', 800.00, 'Compras no supermercado', 'Alimentação', CURRENT_DATE - INTERVAL '2 days'),
		('demo-user', 'expense', 1200.00, 'Aluguel', 'Moradia', CURRENT_DATE - INTERVAL '3 days'),
		('demo-user', 'income', 1500.00, 'Projeto freelance', 'Freelance', CURRENT_DATE - INTERVAL '5 days'),
		('demo-user', 'expense', 250.00, 'Combustível', 'Transporte', CURRENT_DATE - INTERVAL '7 days'),
		('demo-user', 'expense', 150.00, 'Cinema', 'Lazer', CURRENT_DATE - INTERVAL '10 days'),
		('demo-user', 'expense', 300.00, 'Consulta médica', 'Saúde', CURRENT_DATE - INTERVAL '15 days'),
		('demo-user', 'income', 800.00, 'Dividendos', 'Investimentos', CURRENT_DATE - INTERVAL '20 days')
		ON CONFLICT DO NOTHING;
	ELSE
		RAISE NOTICE 'Estrutura avançada detectada - ignorando dados de exemplo legados em transactions.';
	END IF;
END $$;
