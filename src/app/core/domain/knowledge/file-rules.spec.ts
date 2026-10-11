import { MAX_FILES, MAX_FILE_BYTES, kindOfFile, validateFiles } from './file-rules';

function fileOf(name: string, size = 1024): File {
  return new File([new Uint8Array(size)], name);
}

describe('kindOfFile', () => {
  it('classifies the supported extensions, ignoring case', () => {
    expect(kindOfFile('Catalogo.PDF')).toBe('pdf');
    expect(kindOfFile('precios.xlsx')).toBe('spreadsheet');
    expect(kindOfFile('datos.csv')).toBe('spreadsheet');
    expect(kindOfFile('foto.jpeg')).toBe('image');
    expect(kindOfFile('notas.md')).toBe('text');
  });

  it('returns null for unsupported or extension-less names', () => {
    expect(kindOfFile('virus.exe')).toBeNull();
    expect(kindOfFile('pdf')).toBeNull();
  });
});

describe('validateFiles', () => {
  it('accepts valid files', () => {
    const result = validateFiles([fileOf('a.pdf'), fileOf('b.png')], 0);
    expect(result.accepted.map((file) => file.name)).toEqual(['a.pdf', 'b.png']);
    expect(result.rejected).toEqual([]);
  });

  it('rejects unsupported types, empty files and files over the size limit', () => {
    const result = validateFiles([fileOf('a.exe'), fileOf('b.pdf', 0), fileOf('c.pdf', MAX_FILE_BYTES + 1)], 0);
    expect(result.accepted).toEqual([]);
    expect(result.rejected.map((item) => item.name)).toEqual(['a.exe', 'b.pdf', 'c.pdf']);
    expect(result.rejected[0].reason).toContain('Tipo no admitido');
    expect(result.rejected[1].reason).toContain('vacío');
    expect(result.rejected[2].reason).toContain('10 MB');
  });

  it('stops accepting once the total file limit is reached', () => {
    const result = validateFiles([fileOf('a.pdf'), fileOf('b.pdf')], MAX_FILES - 1);
    expect(result.accepted.map((file) => file.name)).toEqual(['a.pdf']);
    expect(result.rejected.map((item) => item.name)).toEqual(['b.pdf']);
  });
});
