export const translations = {
  ru: {
    // Auth
    authTitle: 'Вход в систему',
    authLogin: 'Уже зарегистрированы?',
    authRegister: 'Впервые здесь?',
    username: 'Имя пользователя',
    password: 'Пароль',
    registerBtn: 'Зарегистрироваться',
    loginBtn: 'Войти',
    logout: 'Выход',
    
    // Header
    fileRepository: 'File Repository',
    tagline: 'Управление версиями файлов',
    
    // Footer
    copyright: '© 2026 File Repository. Все права защищены.',
    description: 'Безопасное облачное хранилище с версионированием файлов',
    
    // Repos
    myRepositories: 'Мои репозитории',
    repositories: 'Репозитории',
    createRepo: 'Создать репозиторий',
    deleteRepo: 'Удалить репозиторий',
    noRepos: 'У вас нет репозиториев',
    createFirst: 'Создайте первый репозиторий',
    backToList: 'Вернуться к списку',
    
    // Repository
    repoContent: 'Содержимое репозитория',
    uploadFile: 'Загрузить файл',
    uploadFolder: 'Загрузить папку',
    createFolder: 'Создать папку',
    folderName: 'Имя папки',
    
    // Files
    fileViewer: 'Просмотр файла',
    versions: 'Версии',
    newVersion: 'Новая версия',
    selectFile: 'Выберите файл',
    commit: 'Коммит',
    commitPlaceholder: 'Описание изменений',
    upload: 'Загрузить',
    close: 'Закрыть',
    closeDiff: 'Закрыть diff',
    compare: 'Сравнить',
    selectForDiff: 'Выбрать для diff',
    cancel: 'Отмена',
    emptyFile: '[Файл пустой]',
    notTextFile: '[Файл не является текстовым файлом]',
    uploadSuccess: 'Файл успешно загружен!',
    uploadVersionSuccess: 'Новая версия успешно загружена!',
    uploadError: 'Ошибка при загрузке',
    deleteFile: 'Удалить файл',
    deleteFolder: 'Удалить папку',
    areYouSure: 'Вы уверены?',
    
    // Global
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
  },
  en: {
    // Auth
    authTitle: 'Sign In',
    authLogin: 'Already registered?',
    authRegister: 'New here?',
    username: 'Username',
    password: 'Password',
    registerBtn: 'Register',
    loginBtn: 'Login',
    logout: 'Logout',
    
    // Header
    fileRepository: 'File Repository',
    tagline: 'File versioning management',
    
    // Footer
    copyright: '© 2026 File Repository. All rights reserved.',
    description: 'Secure cloud storage with file versioning',
    
    // Repos
    myRepositories: 'My Repositories',
    repositories: 'Repositories',
    createRepo: 'Create Repository',
    deleteRepo: 'Delete Repository',
    noRepos: 'You have no repositories',
    createFirst: 'Create your first repository',
    backToList: 'Back to list',
    
    // Repository
    repoContent: 'Repository content',
    uploadFile: 'Upload file',
    uploadFolder: 'Upload folder',
    createFolder: 'Create folder',
    folderName: 'Folder name',
    
    // Files
    fileViewer: 'File viewer',
    versions: 'Versions',
    newVersion: 'New version',
    selectFile: 'Select file',
    commit: 'Commit',
    commitPlaceholder: 'Describe your changes',
    upload: 'Upload',
    close: 'Close',
    closeDiff: 'Close diff',
    compare: 'Compare',
    selectForDiff: 'Select for diff',
    cancel: 'Cancel',
    emptyFile: '[File is empty]',
    notTextFile: '[File is not a text file]',
    uploadSuccess: 'File uploaded successfully!',
    uploadVersionSuccess: 'New version uploaded successfully!',
    uploadError: 'Upload error',
    deleteFile: 'Delete file',
    deleteFolder: 'Delete folder',
    areYouSure: 'Are you sure?',
    
    // Global
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
};

export type Language = 'ru' | 'en';
