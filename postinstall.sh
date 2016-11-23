# Create package.json symlink and runs associated npm commands
if [ -L ./package.json ]
then
  npm prune && npm update && npm install
else
  rm -rf ./{node_modules/,package.json}
  ln -s ./.build/package.json ./package.json && npm install
fi

# Create gulpfile.js symlink in project root
if [ ! -L ./gulpfile.js ]
then
  rm ./gulpfile.js
  ln -s ./.build/gulpfile.js ./gulpfile.js
fi

# Create .stylelintrc symlink in project root
if [ ! -L ./.stylelintrc ]
then
  rm ./.stylelintrc
  ln -s ./.build/stylelintrc ./.stylelintrc
fi

# Create .jscsrc symlink in project root
if [ ! -L ./.jscsrc ]
then
  rm ./.jscsrc
  ln -s ./.build/jscsrc ./.jscsrc
fi

# Create .stylelintrc symlink in project root
if [ ! -L ./.stylelintrc ]
then
  rm ./.stylelintrc
  ln -s ./.build/stylelintrc ./.stylelintrc
fi

# Create .gitignore symlink in project root
if [ ! -L ./.gitignore ]
then
  rm ./.gitignore
  ln -s ./.build/gitignore ./.gitignore
fi

# Create .env file if doesn't exist
if [ ! -e ./.env ]
then
  cat > .env << EOF
API_KEY=xxxxxxxxxx
PASSWORD=xxxxxxxxxx
URL=xxxxxxxxxx.myshopify.com
THEME_ID=xxxxxxxxxx
EOF
  sudo chmod 644 ./.env
fi
