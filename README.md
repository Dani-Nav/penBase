# penBase
# KeyCloud

KeyCloud é um sistema simples e eficiente para upload de arquivos que funciona em conjunto com um pendrive e o Supabase Storage, sem necessidade de autenticação manual.

## 📋 Como funciona

1. O usuário conecta um **pendrive** ao computador
2. O pendrive contém um arquivo `config.json` com as credenciais de autenticação
3. Um aplicativo Python lê o arquivo de configuração e abre o navegador com os parâmetros na URL
4. O site web lê os parâmetros e permite o upload direto para o Supabase Storage

## 🚀 Configuração e Deploy

### Pré-requisitos

- Conta no [GitHub](https://github.com)
- Conta no [Netlify](https://www.netlify.com) (gratuita)
- Conta no [Supabase](https://supabase.com) (gratuita para projetos pequenos)

### Passo 1: Configurar o Supabase

1. Crie uma conta no [Supabase](https://supabase.com) ou faça login se já tiver uma
2. Crie um novo projeto e anote a URL e a chave de API (encontradas em Configurações > API)
3. No menu lateral, acesse "Storage" e crie um novo bucket para armazenar os arquivos
4. Configure as permissões do bucket:
   - Vá para "Storage" > Nome do seu bucket > "Policies"
   - Crie uma política que permita apenas uploads autenticados com o token específico
   - Exemplo de política para upload:
     ```sql
     (bucket_id = 'nome-do-seu-bucket'::text) AND (auth.uid()::text = storage.foldername(name)::text)
     ```

### Passo 2: Configurar o GitHub

1. Crie um novo repositório no GitHub
2. Clone o repositório em sua máquina local:
   ```bash
   git clone https://github.com/seu-usuario/seu-repositorio.git
   cd seu-repositorio
   ```
3. Adicione os arquivos do projeto (`index.html`, `script.js`) ao repositório:
   ```bash
   # Copie os arquivos que o Claude gerou para a pasta do repositório
   git add .
   git commit -m "Configuração inicial do KeyCloud"
   git push origin main
   ```

### Passo 3: Deploy no Netlify

1. Faça login no [Netlify](https://app.netlify.com/)
2. Clique em "New site from Git"
3. Selecione "GitHub" como provedor de Git
4. Escolha o repositório que você criou
5. Em "Build command", deixe em branco (não é necessário para este projeto)
6. Em "Publish directory", deixe como `.` (diretório raiz)
7. Clique em "Deploy site"

O Netlify irá gerar uma URL aleatória para seu site (ex: `https://seu-site-123abc.netlify.app`). Você pode customizar este domínio nas configurações do site.

### Passo 4: Criar o aplicativo Python para o pendrive

Crie um arquivo `keycloud.py` no pendrive com o seguinte conteúdo:

```python
import json
import webbrowser
import urllib.parse
import os
import sys

def main():
    # Determinar o diretório do script (pendrive)
    if getattr(sys, 'frozen', False):
        # Se estiver executando como executável compilado
        script_dir = os.path.dirname(sys.executable)
    else:
        # Se estiver executando como script Python
        script_dir = os.path.dirname(os.path.abspath(__file__))
    
    config_path = os.path.join(script_dir, 'config.json')
    
    try:
        # Ler o arquivo de configuração
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        # Verificar se todas as chaves necessárias existem
        required_keys = ['token', 'user_id', 'bucket']
        for key in required_keys:
            if key not in config:
                print(f"Erro: A chave '{key}' não foi encontrada no arquivo config.json")
                input("Pressione Enter para sair...")
                return
        
        # Construir a URL com os parâmetros
        params = urllib.parse.urlencode({
            'token': config['token'],
            'user_id': config['user_id'],
            'bucket': config['bucket']
        })
        
        # URL do site hospedado no Netlify
        netlify_url = "https://seu-site-keycloud.netlify.app"  # Substitua pelo seu URL do Netlify
        full_url = f"{netlify_url}?{params}"
        
        # Abrir a URL no navegador padrão
        webbrowser.open(full_url)
        
        print("KeyCloud foi aberto no seu navegador!")
        
    except FileNotFoundError:
        print(f"Erro: Arquivo config.json não encontrado em {config_path}")
        print("Verifique se o arquivo existe e está no local correto.")
    except json.JSONDecodeError:
        print("Erro: O arquivo config.json não contém um JSON válido")
    except Exception as e:
        print(f"Erro inesperado: {str(e)}")
    
    input("Pressione Enter para sair...")

if __name__ == "__main__":
    main()
```

### Passo 5: Criar o arquivo de configuração no pendrive

Crie um arquivo `config.json` no pendrive com o seguinte conteúdo:

```json
{
  "token": "seu-token-de-autenticacao-do-supabase",
  "user_id": "id-do-usuario",
  "bucket": "nome-do-seu-bucket"
}
```

Substitua os valores pelas informações corretas do seu projeto Supabase.

### Passo 6: Compilar o Python para executável (opcional)

Para facilitar o uso, você pode compilar o script Python em um executável:

1. Instale o PyInstaller:
   ```bash
   pip install pyinstaller
   ```

2. Compile o script:
   ```bash
   pyinstaller --onefile --icon=keycloud.ico keycloud.py
   ```

3. Copie o executável gerado (`dist/keycloud.exe`) para o pendrive

## 🔒 Considerações de segurança

- O token de autenticação no arquivo `config.json` deve ter permissões limitadas no Supabase (apenas para upload)
- Considere aplicar uma expiração para o token de autenticação
- Use HTTPS para todas as comunicações (o Netlify já fornece isso por padrão)
- Implemente validação de tipos de arquivo no frontend e backend para evitar uploads maliciosos

## 📁 Estrutura do projeto

```
├── index.html          # Interface do usuário para upload
├── script.js           # Lógica de gerenciamento de arquivos e upload
└── README.md           # Este arquivo de documentação
```

## 🛠️ Personalização e melhorias sugeridas

- Adicione um logotipo personalizado
- Implemente um sistema de feedback mais detalhado durante o upload
- Adicione suporte para visualização de arquivos já existentes
- Implemente um sistema de controle de versão para os arquivos
- Adicione suporte para pastas e organização hierárquica

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

## 🤝 Suporte

Para sugestões, problemas ou contribuições, por favor abra uma issue no repositório do GitHub.
