module.exports = {
	apps: [
		{
			name: 'tidytrek-api',
			script: 'server/index.js',
			interpreter: 'node',
			interpreter_args: '--import=/var/www/tidytrek/instrument.js',
			cwd: '/var/www/tidytrek',
			instances: 2,
			exec_mode: 'cluster',
			max_memory_restart: '500M',
			env: {
				NODE_ENV: 'production',
			},
			error_file: '/var/www/tidytrek/logs/pm2-error.log',
			pmx: true,
			instance_var: 'INSTANCE_ID',
		},
	],
};
