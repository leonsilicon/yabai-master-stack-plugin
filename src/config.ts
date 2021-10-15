import 'dotenv/config';

if (process.env.YABAI_PATH === undefined) {
	throw new Error('YABAI_PATH not specified in enviroment/.env file!');
}

export const yabaiPath = process.env.YABAI_PATH;
