import dotenv from 'dotenv';
dotenv.config();
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';

const bucketName = process.env.PROFILE_PHOTO_S3_BUCKET;
const bucketRegion = process.env.AWS_REGION;
const accessKey = process.env.PP_S3_ACCESS_KEY;
const secretAccessKey = process.env.PP_S3_SECRET_ACCESS_KEY;
const profilePhotoCloudfrontUrl = process.env.CLOUDFRONT_PROFILE_PHOTO_URL ?? '';

const s3 = new S3Client({
	credentials: {
		accessKeyId: accessKey ?? '',
		secretAccessKey: secretAccessKey ?? '',
	},
	region: bucketRegion,
});

export const s3UploadProfilePhoto = multer({
	limits: { fileSize: 52428800 }, // 50 mb limit
	fileFilter(_req, file, cb) {
		const { mimetype: type } = file;
		if (type === 'image/jpeg' || type === 'image/png') return cb(null, true);
		cb(null, false);
	},
	storage: multerS3({
		s3: s3,
		bucket: bucketName ?? '',
		metadata: function (_req, file, cb) {
			cb(null, { fieldName: file.fieldname });
		},
		key(_req, file, cb) {
			cb(null, `${Date.now().toString()}-${file.originalname}`);
		},
	}),
});

export const deleteProfilePhotoFromS3 = async (photoUrl: string) => {
	try {
		const keyName = photoUrl.replace(`${profilePhotoCloudfrontUrl}/`, '');

		const photoParams = {
			Bucket: bucketName,
			Key: keyName,
		};
		const deleteCommand = new DeleteObjectCommand(photoParams);
		return await s3.send(deleteCommand);
	} catch (err) {
		return err;
	}
};

export const createProfilePhotoUrlForCloudfront = (key: string | undefined) => {
	if (!key) return '';
	else return `${process.env.CLOUDFRONT_PROFILE_PHOTO_URL}/${key}`;
};
