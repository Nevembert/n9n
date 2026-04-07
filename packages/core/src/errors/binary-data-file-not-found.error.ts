import { UnexpectedError } from 'n9n-workflow';

export class BinaryDataFileNotFoundError extends UnexpectedError {
	constructor(fileId: string) {
		super('Binary data file not found', { extra: { fileId } });
	}
}
