import { Directory, File, Paths } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';

const IMAGES_DIRECTORY = 'fotos';

/**
 * Copia a imagem escolhida na galeria (ou tirada na câmera) do cache
 * temporário para a pasta de documentos do app.
 *
 * Sem essa cópia o `uri` aponta para o cache do sistema, que pode ser
 * apagado pelo OS — a foto sumiria do banco apontando para arquivo morto.
 */
export async function persistImage(
  asset: Pick<ImagePickerAsset, 'uri' | 'fileName' | 'mimeType'>,
): Promise<string> {
  const directory = new Directory(Paths.document, IMAGES_DIRECTORY);

  if (!directory.exists) {
    await directory.create({ intermediates: true, idempotent: true });
  }

  const extension = guessExtension(asset.uri, asset.fileName, asset.mimeType);
  const fileName = `${Date.now()}-${Math.floor(Math.random() * 1e4)}.${extension}`;

  const source = new File(asset.uri);
  const destination = new File(directory, fileName);

  if (source.exists) {
    await source.copy(destination);
  }

  return destination.uri;
}

function guessExtension(uri: string, fileName?: string | null, mimeType?: string | null): string {
  const fromName = fileName?.split('.').pop();
  if (fromName && fromName.length <= 5 && fromName !== fileName) return fromName;

  const fromUri = uri.split('?')[0].split('.').pop();
  if (fromUri && fromUri.length <= 5) return fromUri;

  if (mimeType?.includes('png')) return 'png';
  if (mimeType?.includes('heic')) return 'heic';

  return 'jpg';
}

export async function deletePersistedImage(uri: string): Promise<void> {
  const file = new File(uri);
  if (file.exists) await file.delete();
}
