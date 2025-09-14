# Guia de Instalação e Execução do Projeto PontoMax

Este guia descreve os passos necessários para clonar, configurar e rodar a aplicação PontoMax (Frontend e Backend) em uma nova máquina.

## Pré-requisitos

Antes de começar, garanta que você tenha os seguintes softwares instalados na nova máquina:

  - **Git**: Para clonar o repositório.
  - **Python** (versão 3.10 ou superior): Para rodar o backend Django.
  - **Um editor de código**: Recomenda-se o **Visual Studio Code**.
  - **(Apenas para VS Code)** A extensão **Live Server**: Para rodar o frontend estático.

-----

## Passo 1: Clonando o Repositório

Na nova máquina, abra o terminal, navegue até a pasta onde deseja guardar seus projetos e clone o repositório do GitHub.

```bash
# Substitua a URL pela URL do seu repositório no GitHub
git clone https://github.com/seu-usuario/pontomax-prime.git

# Entre na pasta do projeto que foi criada
cd pontomax-prime
```

-----

## Passo 2: Configurando o Backend (Django)

Todos os comandos a seguir devem ser executados de dentro da pasta `pontomax-backend`.

1.  **Navegue até a pasta do backend:**

    ```bash
    cd pontomax-backend
    ```

2.  **Crie o Ambiente Virtual:**
    Isso cria uma pasta `venv` isolada para as dependências do projeto.

    ```bash
    python -m venv venv
    ```

3.  **Ative o Ambiente Virtual:**

      * No **Windows**:
        ```bash
        venv\Scripts\activate
        ```
      * No **macOS / Linux**:
        ```bash
        source venv/bin/activate
        ```

    Você verá `(venv)` no início da linha do seu terminal.

4.  **Instale as Dependências:**
    Este comando lê o arquivo `requirements.txt` que criamos e instala todas as bibliotecas necessárias (Django, DRF, etc.) de uma só vez.

    ```bash
    pip install -r requirements.txt
    ```

5.  **Crie o Banco de Dados:**
    O comando `migrate` lê os seus modelos e cria o arquivo de banco de dados `db.sqlite3` do zero.

    ```bash
    python manage.py migrate
    ```

6.  **Crie um Superusuário:**
    Você precisará de um usuário administrador para acessar o painel do Django e cadastrar dados.

    ```bash
    python manage.py createsuperuser
    ```

    Siga as instruções para criar seu usuário e senha de administrador.

7.  **Inicie o Servidor Backend:**

    ```bash
    python manage.py runserver
    ```

    Se tudo deu certo, você verá a mensagem `Starting development server at http://127.0.0.1:8000/`. **Deixe este terminal aberto.**

-----

## Passo 3: Rodando o Frontend

O frontend é mais simples, pois não precisa de compilação.

1.  Abra a pasta **raiz do projeto** (`pontomax-prime`) no Visual Studio Code.

2.  Na barra de arquivos à esquerda, encontre o arquivo `index.html`.

3.  Clique com o botão direito do mouse sobre `index.html` e selecione **"Open with Live Server"**.

4.  Isso abrirá o seu navegador em um endereço como `http://127.0.0.1:5500`. Usar o Live Server é importante para evitar problemas de CORS que aconteceriam se você abrisse o arquivo diretamente.

-----

## Passo 4: Testando a Aplicação

Se tudo correu bem, você deve ter:

  - O backend rodando no terminal no endereço `http://127.0.0.1:8000`.
  - O frontend aberto no navegador no endereço `http://127.0.0.1:5500`.

**Para finalizar:**

1.  Acesse o painel de administração (`http://127.0.0.1:8000/admin/`) e faça login com o superusuário que você criou.
2.  Cadastre alguns usuários de teste (ex: um `COLABORADOR` e um `GESTOR`), preenchendo os dados de perfil (salário, etc.).
3.  Acesse o frontend (`http://127.0.0.1:5500`), tente fazer login com um dos usuários de teste e verifique se tudo está funcionando.

Pronto\! Seguindo este guia, qualquer pessoa consegue configurar e rodar seu projeto PontoMax em uma nova máquina.