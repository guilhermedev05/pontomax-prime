# Guia de Instalação e Execução do Projeto PontoMax

Este guia descreve o processo completo e padronizado para configurar o ambiente de desenvolvimento do PontoMax em uma nova máquina Windows.

## Pré-requisitos

Antes de começar, garanta que você tenha os seguintes softwares instalados:

* **Git**: Para clonar o repositório do projeto.
* **Python** (versão 3.10 ou superior): A linguagem principal do backend.
* **Um editor de código**: Recomenda-se o **Visual Studio Code**.

---

## Passo 1: Instalação das Dependências de Sistema (GTK+ via MSYS2)

Para a funcionalidade de geração de PDF, o projeto utiliza a biblioteca `WeasyPrint`, que depende do GTK+. Para garantir um ambiente consistente, a instalação será feita via MSYS2.

#### 1.1 - Instalar o MSYS2

1.  Acesse o site oficial do MSYS2: [https://www.msys2.org/](https://www.msys2.org/)
2.  Baixe o instalador (`msys2-x86_64-....exe`) e execute-o. Siga a instalação padrão ("Next", "Next", "Finish"). O local de instalação padrão é `C:\msys64`.

#### 1.2 - Instalar os Pacotes do GTK+

1.  Após a instalação, abra o terminal **"MSYS2 MinGW 64-bit"** a partir do menu Iniciar. **Não use o CMD ou PowerShell do Windows para estes comandos.**

2.  **Atualize os pacotes do MSYS2.** Execute o comando abaixo. Ele pode pedir para fechar o terminal no final. Se isso acontecer, feche, abra-o novamente e execute o mesmo comando uma segunda vez para garantir que tudo esteja atualizado.
    ```bash
    pacman -Syu
    ```

3.  **Instale as bibliotecas do GTK+**. Copie e cole o comando inteiro abaixo no terminal MSYS2 e pressione Enter. Pressione `Y` (Sim) quando for solicitado a confirmar a instalação.
    ```bash
    pacman -S mingw-w64-x86_64-gtk3 mingw-w64-x86_64-cairo mingw-w64-x86_64-pango
    ```
    Após a conclusão, você pode fechar o terminal do MSYS2.

---

## Passo 2: Clonando e Configurando o Projeto

Agora que as dependências do sistema estão instaladas, vamos configurar o projeto Django.

1.  **Clone o Repositório:**
    Abra um **novo terminal do Windows (CMD ou PowerShell)** ou o terminal integrado do VS Code.
    ```bash
    # Substitua a URL pela URL real do seu repositório no GitHub
    git clone [https://github.com/seu-usuario/pontomax-prime.git](https://github.com/seu-usuario/pontomax-prime.git)
    cd pontomax-prime
    ```

2.  **Navegue até a pasta do backend:**
    ```bash
    cd pontomax-backend
    ```

3.  **Configure o `settings.py` para Encontrar o GTK+:**
    * Abra o arquivo `config/settings.py` no seu editor de código.
    * Copie e cole o bloco de código a seguir no **início** do arquivo, logo após as primeiras linhas de `import`. Isso dirá ao Django onde encontrar as bibliotecas que acabamos de instalar.

    ```python
    # config/settings.py
    import os
    from pathlib import Path

    # --- Bloco de código para localizar o GTK+ via MSYS2 ---
    # Este é o caminho padrão de instalação do MSYS2 para pacotes MinGW 64-bit.
    GTK_FOLDER = r'C:\msys64\mingw64\bin' 

    path_atual = os.environ.get('PATH', '')
    if GTK_FOLDER not in path_atual and os.path.isdir(GTK_FOLDER):
        os.environ['PATH'] = GTK_FOLDER + os.pathsep + path_atual
    # --- Fim do Bloco ---

    # Build paths inside the project like this: BASE_DIR / 'subdir'.
    BASE_DIR = Path(__file__).resolve().parent.parent

    # ... (o resto do arquivo settings.py continua a partir daqui)
    ```

4.  **Crie e Ative o Ambiente Virtual:**
    ```bash
    # Windows
    python -m venv venv
    venv\Scripts\activate
    ```
    Você verá `(venv)` no início da linha do seu terminal.

5.  **Instale as Dependências Python:**
    ```bash
    pip install -r requirements.txt
    ```

6.  **Crie e Configure o Banco de Dados:**
    ```bash
    python manage.py migrate
    python manage.py createsuperuser
    ```
    Siga as instruções para criar seu usuário e senha de administrador.

---

## Passo 3: Executando a Aplicação

1.  **Inicie o Servidor Django:**
    Ainda dentro da pasta `pontomax-backend` e com o ambiente virtual ativado, rode o comando:
    ```bash
    python manage.py runserver
    ```
    Se tudo foi configurado corretamente, o servidor iniciará sem erros relacionados ao WeasyPrint.

2.  **Acesse a Aplicação:**
    * **Aplicação Principal:** `http://127.0.0.1:8000/`
    * **Painel Admin do Django:** `http://127.0.0.1:8000/admin/`

---

## Passo 4: Primeiros Passos na Aplicação

1.  Acesse o painel de administração do Django (`.../admin/`) para cadastrar usuários de teste (ex: um `COLABORADOR` e um `GESTOR`).
2.  Acesse a aplicação principal (`http://127.0.0.1:8000/`), faça login com um dos usuários criados e teste as funcionalidades, incluindo a geração de PDFs.

Pronto! Este guia padroniza a instalação e garante que qualquer desenvolvedor em uma máquina Windows possa configurar o ambiente de forma idêntica e sem a necessidade de privilégios de administrador.