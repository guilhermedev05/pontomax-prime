# Guia de Instalação e Execução do Projeto PontoMax

Este guia descreve os passos necessários para clonar, configurar e rodar a aplicação PontoMax (Frontend e Backend) em uma nova máquina.

## Pré-requisitos

Antes de começar, garanta que você tenha os seguintes softwares instalados na nova máquina:

  * **Git**: Para clonar o repositório.
  * **Python** (versão 3.10 ou superior): Para rodar o backend Django.
  * **Um editor de código**: Recomenda-se o **Visual Studio Code**.

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

## Passo 2: Configurando o Ambiente

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
    Este comando lê o arquivo `requirements.txt` e instala todas as bibliotecas necessárias (Django, DRF, etc.).

    ```bash
    pip install -r requirements.txt
    ```

5.  **Crie o Banco de Dados:**
    O comando `migrate` lê os modelos do projeto e cria o arquivo de banco de dados `db.sqlite3` do zero.

    ```bash
    python manage.py migrate
    ```

6.  **Crie um Superusuário:**
    Você precisará de um usuário administrador para acessar o painel do Django e cadastrar dados.

    ```bash
    python manage.py createsuperuser
    ```

    Siga as instruções para criar seu usuário e senha de administrador.

-----

## Passo 3: Executando a Aplicação

Com a nova configuração, o servidor do Django é responsável por rodar tanto o backend quanto o frontend.

1.  **Inicie o Servidor Django:**
    Ainda dentro da pasta `pontomax-backend` e com o ambiente virtual ativado, rode o comando:

    ```bash
    python manage.py runserver
    ```

2.  **Acesse a Aplicação:**
    Se tudo deu certo, você verá a mensagem `Starting development server at http://127.0.0.1:8000/`.
    Agora, basta abrir seu navegador e acessar esse endereço:

      * **Aplicação Principal (Frontend):** `http://127.0.0.1:8000/`
      * **Painel Administrativo (Backend):** `http://127.0.0.1:8000/admin/`

    **Deixe o terminal rodando** para manter o servidor ativo.

-----

## Passo 4: Testando a Aplicação

Se tudo correu bem, o servidor Django está ativo e servindo sua aplicação completa no endereço `http://127.0.0.1:8000`.

**Para finalizar:**

1.  Acesse o painel de administração (`http://127.0.0.1:8000/admin/`) e faça login com o superusuário que você criou.
2.  Cadastre alguns usuários de teste (ex: um `COLABORADOR` e um `GESTOR`), preenchendo os dados de perfil (salário, etc.).
3.  Acesse a aplicação principal (`http://127.0.0.1:8000/`), tente fazer login com um dos usuários de teste e verifique se tudo está funcionando.

Pronto\! Seguindo este guia, qualquer pessoa consegue configurar e rodar seu projeto PontoMax em uma nova máquina.