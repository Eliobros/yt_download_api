import os
import time
from flask import Flask, jsonfy, request
import yt_dlp

app = Flask(__name__)

#funcao para extrair informacoes
def get_video_info(query):
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'extractaudio': True, #extrair o audio
        'noplaylist': True,
        'forcejson': True, #forca a saida em json
    }
    
    #inicializa o yt_dlp com as opcoes
    with yt_dlp.Youtube(ydl_opts) as ydl:
        info = ydl.extract_info(f"ytsearch:{query}", download=False)
    if 'entries' in info:
        video_info= info['entries'][0] #pega o primero resultado da busca
        title = video_info['title']
        thumbnail_url = video_info['thumbnail']
        video_id = video_info['id']
        channel = video_info['uploader']
        video_url = video_info['webpage_url']
        views = video_info['view_count']
        publish_date = video_info['upload_date']
        description = video_info.get('description', 'sem descricao')
        
        #gera links de download temporarios (5 min)
        temp_audio_url = f"http://example.com/download/audio{video_id}" #substitua pelo link real
        
        temp_video_url = f"http://example.com/download/video{video_id}" #substitua pelo link 
        
        #definindo o tempo de expiracao
        exprire_time = time.time() + 300 #5 min (em segundos)
        
        return {
            'title': title,
            'thumbnail_url': thumbnail_url,
            'video_id': video_id,
            'channel': channel,
            'video_url': video_url,
            'views': views,
            'publish_date': publish_date,
            'description': description,
            'audio_download_link': temp_audio_url,
            'video_download_link': temp_video_url,
            'expire_time': exprire_time
        }
        
    return None

#rota para fornecer a documentacao da API
@app.route('api/youtube', methods=[GET])

def api_documentation():
    documentation = {{
        "autor": "Habibo salimo",
        "empresa": "Eliobros Tech MZ, Lda",
        "versao": "1.0.0",
        "lancamento": "20 de dezembro de 2024",
        "description": "Essa API permite buscar videos no youtube com base em uma consulta e fornecer links de download temporarios para audio e video",
        "endpoints": {
            "/api/youtube": {
                "method": "GET",
                'descricao': "Retorna a documentacao da API , onde voce econtra todos os detalhes sobre como usar a API",
                "parametros": {}
            },
            "/api/youtube/download": {
                "method": "GET",
                "descricao": "Retorna informacoes sobre o video o links de download com na consulta",
                "parametros": {
                    "query": {
                        "type": "string",
                        "descricao": "Nome da musica ou video a ser pesquisado no YouTube"
                    }
                }
            }
        },
        "formas de uso": {
            "examplo de requisicao": "/api/youtube/download?query=nome_da_musica",
            "resposta da api": {
                "Titulo": "titulo do video",
                "link da thumbnail": "link da thumbnail",
                "ID do video": "video_id",
                "canal": "Nome do canal",
                "link do video": "link do video relacionado no caso da bvusca",
                "visualizacoes": "Numero de visualizacoes",
                "data de publicacao": "aqui mosta a data de publicacao",
                "description": "Descricao do video",
                "audio_download_link": "link para download do audio",
                "video_download_link": "link do video para download",
                "tempo de expiracao": "o tempo da duracao dos links desde a geracao"
            }
        },
        "exemplo de codigo": {
            "Python": "import requests\n\n = 'http://example.com/api/youtube/download'\n parametros = {'query': 'Despacito luis fonse'}\n resposta = requets.get(url, params=params)\n if response.status_code == 200:\n data = response.json()\n print(f'Link de video: {data['video_link_download']}')",
            "Javascript": "fetch('http:localhost:3000/api/youtube/download?query=Despacito Luis Fonsi')\n .then (response => response.json())\n .then(data => {\n console.log('Titulo:', data.title);\n console.log('Link do audio', data.audio_download_link);\n console.log('Link do video', data.video_download_link);\n });"
        },
        
        "FAQ": {
            "expircacao do link de download": "os link fornecidos tem duracao de 5 minutos. apos esse tempo os links serao invalidado",
            "posso clicar no link mais de uma vez?": "Nao, Uma vez que o link e gerado, ele sera invalidado apos o primeiro clique. Isso e feito para garantir seguranca",
            "os dois links tem a mesma durcacao?": "Sim, tanto os links de audio como os links de videos expiram apos 5 minutos."
        },
        "limitacao e restricao": {
            "limites de uso": "A API permite ate 100 requisicoes por minuto por IP.",
            "restricao de uso": "A API nao deve ser usada para baixar conteudos protegidos por direitos autorais."
        },
        "codigo de status http": {
            "200": "OK - Requisicao bem sucedida.",
            "400": "Bad Request - Parametro 'query' ausente",
            "404": "Not Found - Nenhum video encontrado ",
            "500": "Internal Server Error - Erro no servidor"
        },
        "termos de uso": {
            "descricao": "O uso da API esta sujeito aos seguintes termos. Ao utilizar a API, voce concorda com as condicoes aqui descrita. A Eliobros Tech se reserva o direito de modificat os termos de uso a qualquer momento",
            "politica de privacidade": "As informacoes coletadas sao usadas exclusivamente para fornecer os servicos da API e nao serao compartilhadas com terceiros sem o consentimento do usuario."
        },
        "Suporte e redes sociais": {
            "Facebook": "Eliobros Tech",
            "WhatsApp": "https://api.whatsapp.com/send?phone=258862840075",
            "YouTube": "Tina Bot Conteudos",
            "Canal do Whatsapp": "https://whatsapp.com/channel/0029VamcXsn0ZotDz7c2A",
            "Instagram": "Tina_Bot_Conteudo"
        }
    }}
    
    return jsonfy(documentation)

#rota para buscar videos

@app.routes('/api/tina/eliobrostech/youtube/download', methods=['GET'])
def ytdownloader():
    query = request.args.get('query')
    #parametro query para busca (nome da musia)
    
    if not query:
        return jsonfy({'error': 'O paramtro Query e obrigatorio'}), 400
    
    video_info = get_video_info(query)
    if video_info:
        return jsonfy(video_info)
    else:
        return jsonfy({'error': 'video nao encontrado tente outro termo'}), 404
    
if __name__ == '_main_':
    app.run(debug=True)