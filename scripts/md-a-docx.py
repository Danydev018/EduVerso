#!/usr/bin/env python3
"""
Convierte un Markdown a .docx con el formato que pide la UNEG para el PG.

    python3 scripts/md-a-docx.py docs/ARCHIVO.md docs/ARCHIVO.docx

───────────────────────────────────────────────────────────────────────────
POR QUÉ ESTE SCRIPT Y NO PANDOC

Pandoc no está instalado. La ruta que sí existe en esta máquina es
LibreOffice, que convierte HTML a .docx, así que el camino es
Markdown → HTML → .docx. Este archivo es el primer tramo.

───────────────────────────────────────────────────────────────────────────
POR QUÉ LAS IMÁGENES VAN EN BASE64 Y NO COMO RUTA

Con `<img src="figura.png">`, LibreOffice escribe en el .docx una REFERENCIA
al archivo (`r:link`), no la imagen. El documento se ve bien aquí —el PNG está
al lado— y aparece roto en cualquier otra computadora: la del tutor, la del
jurado. No hay carpeta `word/media/` dentro del archivo.

Con `<img src="data:image/png;base64,...">` LibreOffice escribe `r:embed` y
mete el PNG dentro del .docx. Comprobado: el archivo incrustado sale byte por
byte idéntico al original, sin recomprimir.

───────────────────────────────────────────────────────────────────────────
POR QUÉ LAS LISTAS NUMERADAS ACEPTAN LÍNEAS EN BLANCO ENTRE ELEMENTOS

En el Markdown de la propuesta los objetivos específicos van separados por
línea en blanco, porque así se leen mejor en el fuente. Un parser ingenuo
cierra la lista en cada blanco y abre una nueva, y entonces los cinco
objetivos salen numerados «1.» cinco veces. La numeración correlativa es
justo lo que revisa la Comisión, así que la lista continúa mientras la
siguiente línea con contenido siga siendo un elemento.
"""
import base64
import html
import io
import mimetypes
import os
import re
import sys
import tempfile

NUM = re.compile(r'^(\d+)\.\s+(.*)$')
IMG = re.compile(r'^!\[(.*?)\]\((.+?)\)\s*$')


def datos_incrustados(ruta, base):
    """Devuelve la imagen como data-URI. Ver la nota de cabecera."""
    completa = ruta if os.path.isabs(ruta) else os.path.join(base, ruta)
    if not os.path.exists(completa):
        raise SystemExit(f'No existe la imagen: {completa}')
    tipo = mimetypes.guess_type(completa)[0] or 'image/png'
    b64 = base64.b64encode(open(completa, 'rb').read()).decode()
    return f'data:{tipo};base64,{b64}'


def en_linea(t):
    t = html.escape(t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'(?<!\*)\*([^*]+?)\*(?!\*)', r'<i>\1</i>', t)
    t = re.sub(r'\[(.+?)\]\((.+?)\)', r'<a href="\2">\1</a>', t)
    t = re.sub(r'`(.+?)`', r'<span style="font-family:Courier New">\1</span>', t)
    return t


def primera_con_contenido(lineas, i):
    while i < len(lineas) and not lineas[i].strip():
        i += 1
    return (lineas[i].strip() if i < len(lineas) else ''), i


def convertir(md, base):
    out, i, figura = [], 0, 0
    lineas = md.split('\n')

    while i < len(lineas):
        l = lineas[i]
        s = l.strip()

        # ── Figura: ![pie de figura](ruta/captura.png) ──
        m = IMG.match(s)
        if m:
            figura += 1
            pie, ruta = m.group(1), m.group(2)
            src = datos_incrustados(ruta, base)
            out.append(
                '<div style="text-align:center;margin:16pt 0">'
                f'<img src="{src}" style="width:14cm"/>'
                f'<p style="font-size:10pt;text-align:center;margin-top:6pt">'
                f'<b>Figura {figura}.</b> {en_linea(pie)}</p></div>'
            )
            i += 1
            continue

        if s.startswith('|'):
            filas = []
            while i < len(lineas) and lineas[i].strip().startswith('|'):
                filas.append(lineas[i].strip())
                i += 1
            filas = [f for f in filas if not re.match(r'^\|[\s:|-]+\|$', f)]
            out.append('<table border="1" cellspacing="0" cellpadding="5" '
                       'style="border-collapse:collapse;width:100%">')
            for n, f in enumerate(filas):
                celdas = [c.strip() for c in f.strip('|').split('|')]
                tag = 'th' if n == 0 else 'td'
                out.append('<tr>' + ''.join(
                    f'<{tag} style="vertical-align:top">{en_linea(c)}</{tag}>'
                    for c in celdas) + '</tr>')
            out.append('</table>')
            continue

        if s == '---':
            out.append('<hr/>'); i += 1; continue
        if s == '<br>':
            out.append('<p>&nbsp;</p>'); i += 1; continue
        if not s:
            i += 1; continue

        m = re.match(r'^(#{1,6})\s+(.*)$', s)
        if m:
            n = len(m.group(1))
            tam = {1: 16, 2: 14, 3: 12.5, 4: 12}.get(n, 12)
            out.append(f'<p style="font-size:{tam}pt;font-weight:bold;'
                       f'margin-top:14pt;margin-bottom:6pt">{en_linea(m.group(2))}</p>')
            i += 1
            continue

        if NUM.match(s):
            items = []
            while i < len(lineas):
                ss = lineas[i].strip()
                mm = NUM.match(ss)
                if mm:
                    items.append(mm.group(2)); i += 1
                elif lineas[i].startswith('   ') and ss and items:
                    items[-1] += ' ' + ss; i += 1
                elif not ss:
                    sig, j = primera_con_contenido(lineas, i)
                    if NUM.match(sig) or (j < len(lineas) and lineas[j].startswith('   ')):
                        i = j          # la lista continúa; ver nota de cabecera
                    else:
                        break
                else:
                    break
            out.append('<ol>' + ''.join(
                f'<li style="text-align:justify;margin-bottom:6pt">{en_linea(x)}</li>'
                for x in items) + '</ol>')
            continue

        if s.startswith('- '):
            items = []
            while i < len(lineas):
                ss = lineas[i].strip()
                if ss.startswith('- '):
                    items.append(ss[2:]); i += 1
                elif lineas[i].startswith('  ') and ss and items:
                    items[-1] += ' ' + ss; i += 1
                elif not ss:
                    sig, j = primera_con_contenido(lineas, i)
                    if sig.startswith('- '):
                        i = j
                    else:
                        break
                else:
                    break
            out.append('<ul>' + ''.join(
                f'<li style="text-align:justify;margin-bottom:6pt">{en_linea(x)}</li>'
                for x in items) + '</ul>')
            continue

        parr = []
        while (i < len(lineas) and lineas[i].strip()
               and not lineas[i].strip().startswith(('|', '#', '- ', '---', '!['))
               and not NUM.match(lineas[i].strip())):
            parr.append(lineas[i].strip()); i += 1
        out.append(f'<p style="text-align:justify;margin-bottom:8pt">'
                   f'{en_linea(" ".join(parr))}</p>')

    return out, figura


def main():
    if len(sys.argv) < 3:
        raise SystemExit('uso: md-a-docx.py entrada.md salida.docx')
    entrada, salida = sys.argv[1], sys.argv[2]
    base = os.path.dirname(os.path.abspath(entrada))

    cuerpo, figuras = convertir(io.open(entrada, encoding='utf-8').read(), base)

    # Márgenes de la UNEG: 3 cm arriba, abajo y derecha; 4 cm a la izquierda
    # para el encuadernado. Times New Roman 12 a espacio y medio.
    doc = ('<!DOCTYPE html><html><head><meta charset="utf-8">'
           '<title>Trabajo de Grado</title><style>\n'
           '@page { size: 21.59cm 27.94cm; margin: 3cm 3cm 3cm 4cm; }\n'
           "body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }\n"
           'table { font-size: 11pt; }\n'
           '</style></head><body>\n' + '\n'.join(cuerpo) + '</body></html>')

    destino = os.path.dirname(os.path.abspath(salida))
    raiz = 'md-a-docx-tmp'
    tmp = os.path.join(destino, raiz + '.html')
    io.open(tmp, 'w', encoding='utf-8').write(doc)

    """
    POR QUÉ EL PERFIL APARTE (-env:UserInstallation)

    LibreOffice no deja usar el mismo perfil de usuario desde dos procesos. Si
    hay una ventana abierta —y es lo normal: uno tiene el .docx a la vista
    mientras corrige el Markdown—, la conversión headless termina en exit=0 y
    NO ESCRIBE NADA. No da error: simplemente no hace el trabajo, y uno se
    queda con la versión anterior creyendo que regeneró.

    Con un perfil propio en /tmp el proceso headless es independiente y
    convierte aunque el documento esté abierto en pantalla.
    """
    perfil = os.path.join(tempfile.gettempdir(), 'lo-md-a-docx')
    orden = (f'timeout 300 soffice -env:UserInstallation=file://{perfil} '
             f'--headless --convert-to docx:"MS Word 2007 XML" '
             f'--outdir "{destino}" "{tmp}" >/dev/null 2>&1')

    generado = os.path.join(destino, raiz + '.docx')
    fallo = os.system(orden)

    if fallo or not os.path.exists(generado):
        os.remove(tmp)
        raise SystemExit('LibreOffice no generó el .docx.')

    os.replace(generado, salida)
    os.remove(tmp)
    print(f'{salida}  ({figuras} figura{"s" if figuras != 1 else ""} incrustada'
          f'{"s" if figuras != 1 else ""})')


if __name__ == '__main__':
    main()
