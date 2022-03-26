const path = require('path');

module.exports = {
	extends: [require.resolve('@leonzalion/configs/eslint.cjs')],
	parserOptions: {
		project: [path.resolve(__dirname, './tsconfig.eslint.json')],
	},
	overrides: [
		{
			files: ['scripts/**/*.ts'],
			rules: {
				'import/no-extraneous-dependencies': [
					'error',
					{
						packageDir: __dirname,
					},
				],
			},
		},
	],
};
