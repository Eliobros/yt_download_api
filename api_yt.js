const express = require('express');
const playdl = require('play-dl');
const crypto = require('crypto');
const app = express();

const downloadLinks = {}; // Para armazenar links temporários

// Função para gerar links de download temporários
function generateTempLink(videoId, type) {
    const token = crypto.randomBytes(16).toString('hex'); // Gerar um token único
    const link = `http://localhost:3000/download/${type}/${videoId}/${token}`;

    // Expirar o link após 5 minutos
    setTimeout(() => {
        delete downloadLinks[token];
    }, 300000);

    downloadLinks[token] = { videoId, type };
    return link;
}

// Endpoint para a documentação da API
app.get('/api/youtube', (req, res) => {
    const documentation = {
        "autor": "Habibo Salimo",
        "empresa": "Eliobros Tech MZ, Lda",
        "versao": "1.0.0",
        "lancamento": "20 de dezembro de 2024",
        "description": "Essa API permite buscar videos no youtube com base em uma consulta e fornecer links de download temporarios para audio e video",
        "endpoints": {
            "/api/youtube": {
                "method": "GET",
                "descricao": "Retorna a documentacao da API, onde voce encontra todos os detalhes sobre como usar a API",
                "parametros": {}
            },
            "/api/youtube/download": {
                "method": "GET",
                "descricao": "Retorna informacoes sobre o video e links de download com base na consulta",
                "parametros": {
                    "query": {
                        "type": "string",
                        "descricao": "Nome da musica ou video a ser pesquisado no YouTube"
                    }
                }
            }
        },
        "formas de uso": {
            "exemplo de requisicao": "/api/youtube/download?query=nome_da_musica",
            "resposta da api": {
                "Titulo": "titulo do video",
                "link da thumbnail": "link da thumbnail",
                "ID do video": "video_id",
                "canal": "Nome do canal",
                "link do video": "link do video relacionado no caso da busca",
                "visualizacoes": "Numero de visualizacoes",
                "data de publicacao": "aqui mostra a data de publicacao",
                "description": "Descricao do video",
                "audio_download_link": "link para download do audio",
                "video_download_link": "link do video para download",
                "tempo de expiracao": "o tempo da duracao dos links desde a geracao"
            }
        },
        "exemplo de codigo": {
            "Python": `import requests

url = 'http://example.com/api/youtube/download'
parametros = {'query': 'Despacito luis fonse'}
resposta = requests.get(url, params=parametros)
if resposta.status_code == 200:
    data = resposta.json()
    print(f'Link de video: {data['video_download_link']}')`,
            "Javascript": `fetch('http://localhost:3000/api/youtube/download?query=Despacito Luis Fonsi')
.then(response => response.json())
.then(data => {
    console.log('Titulo:', data.title);
    console.log('Link do audio', data.audio_download_link);
    console.log('Link do video', data.video_download_link);
});`
        },
        "FAQ": {
            "expiracao do link de download": "Os links fornecidos tem duracao de 5 minutos. Após esse tempo, os links serão invalidados.",
            "posso clicar no link mais de uma vez?": "Não, uma vez que o link é gerado, ele será invalidado após o primeiro clique. Isso é feito para garantir segurança.",
            "os dois links tem a mesma duracao?": "Sim, tanto os links de áudio quanto os links de vídeo expiram após 5 minutos."
        },
        "limitacao e restricao": {
            "limites de uso": "A API permite até 100 requisições por minuto por IP.",
            "restricao de uso": "A API não deve ser usada para baixar conteúdos protegidos por direitos autorais."
        },
        "codigo de status http": {
            "200": "OK - Requisição bem-sucedida.",
            "400": "Bad Request - Parâmetro 'query' ausente.",
            "404": "Not Found - Nenhum vídeo encontrado.",
            "500": "Internal Server Error - Erro no servidor."
        },
        "termos de uso": {
            "descricao": "O uso da API está sujeito aos seguintes termos. Ao utilizar a API, você concorda com as condições aqui descritas. A Eliobros Tech se reserva o direito de modificar os termos de uso a qualquer momento.",
            "politica de privacidade": "As informações coletadas são usadas exclusivamente para fornecer os serviços da API e não serão compartilhadas com terceiros sem o consentimento do usuário."
        },
        "Suporte e redes sociais": {
            "Facebook": "Eliobros Tech",
            "WhatsApp": "https://api.whatsapp.com/send?phone=258862840075",
            "YouTube": "Tina Bot Conteudos",
            "Canal do WhatsApp": "https://www.whatsapp.com/channel/0029VamcXnuFsn0ZotDz7c2A",
            "Instagram": "Tina_Bot_Conteudo"
        }
    };
    res.json(documentation);
});

// Endpoint para buscar vídeos no YouTube
app.get('/api/youtube/download', async (req, res) => {
    const query = req.query.query;

    if (!query) {
        return res.status(400).json({ error: "O parâmetro 'query' é obrigatório." });
    }

    try {
        const [video] = await playdl.search(query, { limit: 1 });

        if (!video) {
            return res.status(404).json({ error: "Vídeo não encontrado. Tente outro termo." });
        }

        const videoId = video.id;
        const title = video.title;
        const thumbnail_url = video.thumbnails[0].url;
        const channel = video.channel.name;
        const video_url = video.url;
        const views = video.views;
        const publish_date = video.uploaded_at;
        const description = video.description || "Sem descrição";

        // Gerar links de download
        const audio_download_link = generateTempLink(videoId, 'audio');
        const video_download_link = generateTempLink(videoId, 'video');

        res.json({
            title,
            thumbnail_url,
            video_id: videoId,
            channel,
            video_url,
            views,
            publish_date,
            description,
            audio_download_link,
            video_download_link,
            expire_time: 300 // 5 minutos
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro no servidor. Tente novamente mais tarde." });
    }
});

// Rota para gerenciar os downloads (áudio e vídeo)
app.get('/download/:type/:videoId/:token', async (req, res) => {
    const { type, videoId, token } = req.params;

    if (!downloadLinks[token]) {
        return res.status(404).json({ error: "Link expirado ou inválido." });
    }

    if (downloadLinks[token].videoId !== videoId || downloadLinks[token].type !== type) {
        return res.status(400).json({ error: "Dados do link não conferem." });
    }

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        if (type === 'audio') {
            const audioStream = await playdl.stream(videoUrl, { quality: 140 });

            res.setHeader('Content-Disposition', `attachment; filename="${videoId}_audio.mp3"`);
            res.setHeader('Content-Type', 'audio/mpeg');
            audioStream.stream.pipe(res);
        } else if (type === 'video') {
            const videoStream = await playdl.stream(videoUrl, { quality: 137 });

            res.setHeader('Content-Disposition', `attachment; filename="${videoId}_video.mp4"`);
            res.setHeader('Content-Type', 'video/mp4');
            videoStream.stream.pipe(res);
        } else {
            res.status(400).json({ error: "Tipo de download inválido." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao processar o download." });
    }
});

// Inicialização do servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
