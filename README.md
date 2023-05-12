<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>

# 🤖 Automated Code Reviews powered by ChatGPT 🤖

A GitHub action uses OpenAI's GPT-4 to perform automated code reviews. When you create a PR, our action will automatically review the code and suggest changes, just like a human code reviewer would. 

## 🚀 How to use it

- Get an API Key from [OpenAI](https://platform.openai.com/account/api-keys)
- Add it as a Github secret
- Setup an action that runs on every PR

```
name: 'AutoReviewer'
on: # rebuild any PRs and main branch changes
  pull_request:
jobs:
  code-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: ./
        env:
          NODE_OPTIONS: '--experimental-fetch'
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          temperature: 0
          exclude_files: '*.js, *.json, *.md, *.yml, *.js.map'
```
- Or when a label is added
```
name: 'AutoReviewer'
on: # rebuild any PRs and main branch changes
  pull_request:
    types: [labeled]
jobs:
  code-review:
    if: ${{ contains( github.event.label.name, 'AutoReview') }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: ./
        env:
          NODE_OPTIONS: '--experimental-fetch'
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          temperature: 0
          exclude_files: '*.js, *.json, *.md, *.yml, *.js.map'
```

## 🎉 Benefits

Using our GitHub action has many benefits, such as:
- Faster code reviews
- More consistent feedback
- Increased productivity
- Improved code quality

## 🤞 Limitations

This Github Action is still in early development

## 🙌 Contributing

If you have any ideas or improvements to our GitHub action, feel free to submit a PR. We welcome all contributions! 
