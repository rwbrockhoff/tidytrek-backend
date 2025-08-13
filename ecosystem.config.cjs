module.exports = {
	apps: [
		{
			name: 'tidytrek-api',
			script: '/var/www/tidytrek/server/index.js',
			cwd: '/var/www/tidytrek',
			instances: 2,
			max_memory_restart: '500M',
			env_file: '/var/www/tidytrek/production.env',
			error_file: '/var/www/tidytrek/logs/pm2-error.log',
			// enables monitoring
			pmx: true,
			// useful debugging naming convention
			instance_var: 'INSTANCE_ID',
		},
	],
};
