export interface MulterS3File extends Express.Multer.File {
	key: string;
	bucket: string;
	location: string;
}