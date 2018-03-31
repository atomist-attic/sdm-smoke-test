
npm run compile:ts

cp -r smoke-test/features/*.feature build/smoke-test/features

./node_modules/.bin/cucumber-js build/smoke-test/features/**/*.feature
