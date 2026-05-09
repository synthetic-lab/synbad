import { EvalParams } from "../../source/evals.ts";
import * as assert from "../../source/asserts.ts";
import { ChatCompletionChunk } from "openai/resources";

export function test({ chatCompletionChunks }: EvalParams) {
  if(chatCompletionChunks !== undefined) {
    assert.isNotEmptyArray(chatCompletionChunks);

    let lastFinishReason: ChatCompletionChunk.Choice["finish_reason"]  | null = null;
    for(const chunk of chatCompletionChunks) {
      for(const choice of chunk.choices) {
        if(choice.finish_reason != null) {
          lastFinishReason = choice.finish_reason;
        }
      }
    }
    assert.strictEqual(lastFinishReason, "tool_calls");
  }
}

export const json = {
  "model": "nemotron-3-super",
  "messages": [
    {
      "role": "system",
      "content": "You are a highly skilled software engineer with extensive knowledge in many programming languages, frameworks, design patterns, and best practices.\n\n## Communication\n\n- Be conversational but professional.\n- Refer to the user in the second person and yourself in the first person.\n- Format your responses in markdown. Use backticks to format file, directory, function, and class names.\n- NEVER lie or make things up.\n- Refrain from apologizing all the time when results are unexpected. Instead, just try your best to proceed or explain the circumstances to the user without apologizing.\n\n## Tool Use\n\n- Make sure to adhere to the tools schema.\n- Provide every required argument.\n- DO NOT use tools to access items that are already available in the context section.\n- Use only the tools that are currently available.\n- DO NOT use a tool that is not available just because it appears in the conversation. This means the user turned it off.\n- You can call multiple tools in a single response. If you intend to call multiple tools and there are no dependencies between them, make all independent tool calls in parallel. Maximize use of parallel tool calls where possible to increase efficiency. However, if some tool calls depend on previous calls to inform dependent values, do NOT call these tools in parallel and instead call them sequentially. For instance, if one operation must complete before another starts, run these operations sequentially instead. Never use placeholders or guess missing parameters in tool calls.\n- When running commands that may run indefinitely or for a long time (such as build scripts, tests, servers, or file watchers), specify `timeout_ms` to bound runtime. If the command times out, the user can always ask you to run it again with a longer timeout or no timeout if they're willing to wait or cancel manually.\n- Avoid HTML entity escaping - use plain characters instead.\n\n## Searching and Reading\n\nIf you are unsure how to fulfill the user's request, gather more information with tool calls and/or clarifying questions.\n\nIf appropriate, use tool calls to explore the current project, which contains the following root directories:\n\n- `/Users/foobar/Sync/foobar Files Private/Notes/blog/articles`\n\n- Bias towards not asking the user for help if you can find the answer yourself.\n- When providing paths to tools, the path should always start with the name of a project root directory listed above.\n- Before you read or edit a file, you must first find the full path. DO NOT ever guess a file path!\n- When looking for symbols in the project, prefer the `grep` tool.\n- As you learn about the structure of the project, use that information to scope `grep` searches to targeted subtrees of the project.\n- The user might specify a partial file path. If you don't know the full path, use `find_path` (not `grep`) before you read the file.\n\n## Code Block Formatting\n\nWhenever you mention a code block, you MUST ONLY use the following format:\n\n```path/to/Something.blah#L123-456\n(code goes here)\n```\n\nThe `#L123-456` means the line number range 123 through 456, and the path/to/Something.blah is a path in the project. (If there is no valid path in the project, then you can use /dev/null/path.extension for its path.) This is the ONLY valid way to format code blocks, because the Markdown parser does not understand the more common ```language syntax, or bare ``` blocks. It only understands this path-based syntax, and if the path is missing, then it will error and you will have to do it over again.\nJust to be really clear about this, if you ever find yourself writing three backticks followed by a language name, STOP!\nYou have made a mistake. You can only ever put paths after triple backticks!\n\n<example>\nBased on all the information I've gathered, here's a summary of how this system works:\n1. The README file is loaded into the system.\n2. The system finds the first two headers, including everything in between. In this case, that would be:\n```path/to/README.md#L8-12\n# First Header\nThis is the info under the first header.\n## Sub-header\n```\n3. Then the system finds the last header in the README:\n```path/to/README.md#L27-29\n## Last Header\nThis is the last header in the README.\n```\n4. Finally, it passes this information on to the next process.\n</example>\n\n<example>\nIn Markdown, hash marks signify headings. For example:\n```/dev/null/example.md#L1-3\n# Level 1 heading\n## Level 2 heading\n### Level 3 heading\n```\n</example>\n\nHere are examples of ways you must never render code blocks:\n<bad_example_do_not_do_this>\nIn Markdown, hash marks signify headings. For example:\n```\n# Level 1 heading\n## Level 2 heading\n### Level 3 heading\n```\n</bad_example_do_not_do_this>\n\nThis example is unacceptable because it does not include the path.\n\n<bad_example_do_not_do_this>\nIn Markdown, hash marks signify headings. For example:\n```markdown\n# Level 1 heading\n## Level 2 heading\n### Level 3 heading\n```\n</bad_example_do_not_do_this>\nThis example is unacceptable because it has the language instead of the path.\n\n<bad_example_do_not_do_this>\nIn Markdown, hash marks signify headings. For example:\n    # Level 1 heading\n    ## Level 2 heading\n    ### Level 3 heading\n</bad_example_do_not_do_this>\nThis example is unacceptable because it uses indentation to mark the code block instead of backticks with a path.\n\n<bad_example_do_not_do_this>\nIn Markdown, hash marks signify headings. For example:\n```markdown\n/dev/null/example.md#L1-3\n# Level 1 heading\n## Level 2 heading\n### Level 3 heading\n```\n</bad_example_do_not_do_this>\nThis example is unacceptable because the path is in the wrong place. The path must be directly after the opening backticks.\n\n## Fixing Diagnostics\n\n1. Make 1-2 attempts at fixing diagnostics, then defer to the user.\n2. Never simplify code you've written just to solve diagnostics. Complete, mostly correct code is more valuable than perfect code that doesn't solve the problem.\n\n## Debugging\n\nWhen debugging, only make code changes if you are certain that you can solve the problem.\nOtherwise, follow debugging best practices:\n1. Address the root cause instead of the symptoms.\n2. Add descriptive logging statements and error messages to track variable and code state.\n3. Add test functions and statements to isolate the problem.\n\n## Calling External APIs\n\n1. Unless explicitly requested by the user, use the best suited external APIs and packages to solve the task. There is no need to ask the user for permission.\n2. When selecting which version of an API or package to use, choose one that is compatible with the user's dependency management file(s). If no such file exists or if the package is not present, use the latest version that is in your training data.\n3. If an external API requires an API Key, be sure to point this out to the user. Adhere to best security practices (e.g. DO NOT hardcode an API key in a place where it can be exposed)\n\n## System Information\n\nOperating System: macos\nDefault Shell: sh\n\n## Model Information\n\nYou are powered by the model named Nemotron 3 Super (Synthetic).\n\n## Available Agent Skills\n\nSkills are located in:\n- Global: `~/.config/zed/skills/<skill-name>/`\n- Worktree-specific: `<worktree>/.agents/skills/<skill-name>/`\n\nEach skill contains:\n- `SKILL.md` - Main instructions\n- `scripts/` - Executable scripts\n- `references/` - Additional documentation\n- `assets/` - Templates, data files, images\n\nTo use a skill, you should use the read_file and list_directory tools to explore skill files, and only use bash for running executable scripts:\n\n**For reading and exploring (use internal tools):**\n- Read SKILL.md: `read_file` with path `~/.config/zed/skills/<skill-name>/SKILL.md`\n- List skill references: `list_directory` with path `~/.config/zed/skills/<skill-name>/references/`\n- List skill scripts: `list_directory` with path `~/.config/zed/skills/<skill-name>/scripts/`\n- Read references: `read_file` with path `~/.config/zed/skills/<skill-name>/references/doc.md`\n\n**For running scripts only (use bash):**\n- Run scripts: `bash ~/.config/zed/skills/<skill-name>/scripts/script.sh`\n\nNote: You typically want to run tools for the current project you're working on, which is why you should use your worktree root as the working directory.\n\n| Skill | Description | Location |\n|-------|-------------|----------|\n| ffmpeg-skill | Use when user asks to convert, compress, trim, resize, extract audio, add subtitles, create GIFs, or process video/audio files | /Users/foobar/.config/zed/skills/ffmpeg-skill |\n| jujutsu | A skill for working with Jujutsu (jj), a modern VCS that provides a powerful mental model for version control with a Git-compatible backend. Always use jj commands instead of git commands. Use &#x60;jj git init&#x60; to initialize jj in a git repository if needed. | /Users/foobar/.config/zed/skills/jujutsu |\n| managing-tasks-with-td | Manages tasks with the td CLI. Use when tracking work items, creating todos, managing task dependencies, or when the user mentions td, tasks, or todos in a project using td. When the project obviously uses something else, or the user doesn&#x27;t mention td explicitly, do not read. | /Users/foobar/.config/zed/skills/managing-tasks-with-td |\n| playwright-cli | Automates browser interactions for web testing, form filling, screenshots, and data extraction using playwright-cli. Use when the user needs to navigate websites, interact with web pages, fill forms, take screenshots, test web applications, extract information from web pages, mock network requests, manage browser sessions, or generate test code. | /Users/foobar/.config/zed/skills/playwright-cli |\n| tmux | Use this tmux skill for launching persistent background processes, interacting with or automating TUI applications via key injection, reading TUI interfaces programmatically, and in all other ways interacting with interactive terminal interfaces designed for a human. | /Users/foobar/.config/zed/skills/tmux |\n| writing-rust | Writes idiomatic, well-structured Rust code following community conventions and best practices. Use when working on Rust projects, writing Rust code, debugging Rust errors, or when the user mentions Rust, Cargo, or crates. | /Users/foobar/.config/zed/skills/writing-rust |\n\nWhen a skill is relevant to the user's request:\n1. **Always start here:** Read SKILL.md to load the skill's instructions using `read_file` with path `~/.config/zed/skills/<skill-name>/SKILL.md`\n2. **Then, based on the instructions in SKILL.md and the user's specific needs:**\n   - Use `list_directory` to explore available resources\n   - Use `read_file` to read reference files\n   - Use `bash` only to run executable scripts\n\n\n## Available Custom Slash Commands\n\nThe user has defined the following custom slash commands that can be invoked with `/command-name`:\n\n- `/search` - Search the codebase\n- `/test` - Test the ability to read and expand slash commands\n- `/review` - Review code for common issues\n- `/explain` - Explain the current codebase\n\n"
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "run "
        },
        {
          "type": "text",
          "text": "[@generate_works_cited.py](file:///Users/foobar/Sync/foobar%20Files%20Private/Notes/blog/articles/generate_works_cited.py)"
        },
        {
          "type": "text",
          "text": "<context>\nThe following items were attached by the user. They are up-to-date and don't need to be re-read.\n\n"
        },
        {
          "type": "text",
          "text": "<files>\n```py /Users/foobar/Sync/foobar Files Private/Notes/blog/articles/generate_works_cited.py\n#!/usr/bin/env python3\n\"\"\"\nGenerate a works cited section from org-mode links.\nExtracts title, OpenGraph metadata, and other bibliographic information.\n\nRun with: uv run generate_works_cited.py <org-file>\n\"\"\"\n\nimport re\nimport sys\nimport html.parser\nfrom dataclasses import dataclass\nfrom typing import List, Optional\nfrom urllib.request import Request, urlopen\nfrom urllib.error import URLError, HTTPError\nfrom urllib.parse import urlparse\n\n\n@dataclass\nclass Citation:\n    url: str\n    title: str = \"\"\n    description: str = \"\"\n    site_name: str = \"\"\n    author: str = \"\"\n    date: str = \"\"\n    publisher: str = \"\"\n    error: Optional[str] = None\n\n    def to_org(self) -> str:\n        \"\"\"Convert citation to org-mode formatted entry\"\"\"\n        if self.error:\n            return f\"* {self.url}\\n\"\n\n        parts = []\n\n        # Author if known\n        if self.author:\n            parts.append(f\"{self.author}.\")\n\n        # Title (use description if title is empty or very short)\n        title = self.title if self.title else self.description\n        if not title:\n            title = self.url\n\n        parts.append(f'\"{title}\"')\n\n        # Site name or publisher\n        if self.site_name:\n            parts.append(f\"*{self.site_name}*\")\n        elif self.publisher:\n            parts.append(f\"*{self.publisher}*\")\n\n        # Date if known\n        if self.date:\n            parts.append(f\"({self.date})\")\n\n        # URL\n        parts.append(f\"[[{self.url}]\")\n\n        return \" \".join(parts) + \"]\\n\"\n\n\nclass MetaParser(html.parser.HTMLParser):\n    \"\"\"HTML parser to extract meta tags\"\"\"\n\n    def __init__(self):\n        super().__init__()\n        self.title = \"\"\n        self.site_name = \"\"\n        self.description = \"\"\n        self.author = \"\"\n        self.date = \"\"\n        self.publisher = \"\"\n        self._in_title = False\n        self._current_tag = None\n        self._current_attrs = {}\n\n    def handle_starttag(self, tag, attrs):\n        attrs_dict = dict(attrs)\n\n        if tag == \"title\":\n            self._in_title = True\n        elif tag == \"meta\":\n            prop = attrs_dict.get(\"property\", \"\") or attrs_dict.get(\"name\", \"\")\n            content = attrs_dict.get(\"content\", \"\")\n\n            if prop == \"og:title\":\n                self.title = content\n            elif prop == \"og:site_name\":\n                self.site_name = content\n            elif prop == \"og:description\":\n                self.description = content\n            elif prop == \"article:author\" or prop == \"author\":\n                self.author = content\n            elif prop in (\"article:published_time\", \"article:published\", \"date\", \"publish-date\"):\n                self.date = content\n            elif prop == \"article:publisher\" or prop == \"publisher\":\n                self.publisher = content\n            elif prop == \"author\":\n                self.author = content\n\n    def handle_endtag(self, tag):\n        if tag == \"title\":\n            self._in_title = False\n\n    def handle_data(self, data):\n        if self._in_title and not self.title:\n            self.title = data.strip()\n\n\ndef extract_org_links(text: str) -> List[str]:\n    \"\"\"Extract URLs from org-mode links like [[url][text]] or [[url]]\"\"\"\n    pattern = r'\\[\\[(https?://[^\\]\\[]+)\\]'\n    matches = re.findall(pattern, text)\n    return list(dict.fromkeys(matches))  # Remove duplicates\n\n\ndef get_domain(url: str) -> str:\n    \"\"\"Extract domain from URL\"\"\"\n    parsed = urlparse(url)\n    return parsed.netloc\n\n\ndef fetch_metadata(url: str, timeout: int = 10) -> Citation:\n    \"\"\"Fetch metadata from a URL\"\"\"\n    citation = Citation(url=url)\n\n    try:\n        headers = {\n            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'\n        }\n        request = Request(url, headers=headers)\n\n        with urlopen(request, timeout=timeout) as response:\n            # Check content-type to ensure it's HTML\n            content_type = response.headers.get('Content-Type', '').lower()\n            if 'text/html' not in content_type and 'application/xhtml' not in content_type:\n                citation.error = f\"Skipped: Not HTML ({content_type})\"\n                return citation\n\n            # Read and parse HTML\n            html_content = response.read().decode('utf-8', errors='ignore')\n\n            try:\n                parser = MetaParser()\n                parser.feed(html_content)\n\n                citation.title = parser.title\n                citation.site_name = parser.site_name\n                citation.description = parser.description\n                citation.author = parser.author\n                citation.date = parser.date\n                citation.publisher = parser.publisher\n\n            except Exception as e:\n                citation.error = f\"Parse error: {e}\"\n                return citation\n\n    except HTTPError as e:\n        citation.error = f\"HTTP Error: {e.code} {e.reason}\"\n    except URLError as e:\n        citation.error = f\"URL Error: {e.reason}\"\n    except Exception as e:\n        citation.error = f\"Error: {e}\"\n\n    return citation\n\n\ndef main():\n    if len(sys.argv) < 2:\n        print(\"Usage: python generate_works_cited.py <org-file>\")\n        sys.exit(1)\n\n    file_path = sys.argv[1]\n\n    # Read the file\n    with open(file_path, 'r', encoding='utf-8') as f:\n        content = f.read()\n\n    # Extract links\n    links = extract_org_links(content)\n    print(f\"Found {len(links)} unique links\", file=sys.stderr)\n\n    # Output header first (so we get partial results on crash)\n    print(\"* Works Cited\", file=sys.stderr)\n    print(file=sys.stderr)\n\n    # Fetch metadata for each and output incrementally\n    for i, url in enumerate(links, 1):\n        print(f\"Fetching {i}/{len(links)}: {url[:60]}...\", file=sys.stderr)\n        citation = fetch_metadata(url)\n        print(citation.to_org(), end='')\n\n\nif __name__ == '__main__':\n    main()\n\n```\n</files>\n"
        },
        {
          "type": "text",
          "text": "</context>"
        }
      ]
    }
  ],
  "stream": true,
  "temperature": 1,
  "parallel_tool_calls": false,
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "copy_path",
        "description": "Copies a file or directory in the project, and returns confirmation that the copy succeeded.\nDirectory contents will be copied recursively.\n\nThis tool should be used when it is desirable to create a copy of a file or directory without modifying the original.\nIt's much more efficient than doing this by separately reading and then writing the file or directory's contents, so this tool should be preferred over that approach whenever copying is the goal.",
        "parameters": {
          "required": [
            "source_path",
            "destination_path"
          ],
          "description": "Copies a file or directory in the project, and returns confirmation that the copy succeeded.\nDirectory contents will be copied recursively.\n\nThis tool should be used when it is desirable to create a copy of a file or directory without modifying the original.\nIt's much more efficient than doing this by separately reading and then writing the file or directory's contents, so this tool should be preferred over that approach whenever copying is the goal.",
          "type": "object",
          "properties": {
            "source_path": {
              "description": "The source path of the file or directory to copy.\nIf a directory is specified, its contents will be copied recursively.\n\n<example>\nIf the project has the following files:\n\n- directory1/a/something.txt\n- directory2/a/things.txt\n- directory3/a/other.txt\n\nYou can copy the first file by providing a source_path of \"directory1/a/something.txt\"\n</example>",
              "type": "string"
            },
            "destination_path": {
              "description": "The destination path where the file or directory should be copied to.\n\n<example>\nTo copy \"directory1/a/something.txt\" to \"directory2/b/copy.txt\", provide a destination_path of \"directory2/b/copy.txt\"\n</example>",
              "type": "string"
            }
          }
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "create_directory",
        "description": "Creates a new directory at the specified path within the project. Returns confirmation that the directory was created.\n\nThis tool creates a directory and all necessary parent directories. It should be used whenever you need to create new directories within the project.",
        "parameters": {
          "required": [
            "path"
          ],
          "description": "Creates a new directory at the specified path within the project. Returns confirmation that the directory was created.\n\nThis tool creates a directory and all necessary parent directories. It should be used whenever you need to create new directories within the project.",
          "type": "object",
          "properties": {
            "path": {
              "description": "The path of the new directory.\n\n<example>\nIf the project has the following structure:\n\n- directory1/\n- directory2/\n\nYou can create a new directory by providing a path of \"directory1/new_directory\"\n</example>",
              "type": "string"
            }
          }
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "delete_path",
        "description": "Deletes the file or directory (and the directory's contents, recursively) at the specified path in the project, and returns confirmation of the deletion.",
        "parameters": {
          "required": [
            "path"
          ],
          "description": "Deletes the file or directory (and the directory's contents, recursively) at the specified path in the project, and returns confirmation of the deletion.",
          "type": "object",
          "properties": {
            "path": {
              "description": "The path of the file or directory to delete.\n\n<example>\nIf the project has the following files:\n\n- directory1/a/something.txt\n- directory2/a/things.txt\n- directory3/a/other.txt\n\nYou can delete the first file by providing a path of \"directory1/a/something.txt\"\n</example>",
              "type": "string"
            }
          }
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "diagnostics",
        "description": "Get errors and warnings for the project or a specific file.\n\nThis tool can be invoked after a series of edits to determine if further edits are necessary, or if the user asks to fix errors or warnings in their codebase.\n\nWhen a path is provided, shows all diagnostics for that specific file.\nWhen no path is provided, shows a summary of error and warning counts for all files in the project.\n\n<example>\nTo get diagnostics for a specific file:\n{\n    \"path\": \"src/main.rs\"\n}\n\nTo get a project-wide diagnostic summary:\n{}\n</example>\n\n<guidelines>\n- If you think you can fix a diagnostic, make 1-2 attempts and then give up.\n- Don't remove code you've generated just because you can't fix an error. The user can help you fix it.\n</guidelines>",
        "parameters": {
          "properties": {
            "path": {
              "description": "The path to get diagnostics for. If not provided, returns a project-wide summary.\n\nThis path should never be absolute, and the first component\nof the path should always be a root directory in a project.\n\n<example>\nIf the project has the following root directories:\n\n- lorem\n- ipsum\n\nIf you wanna access diagnostics for `dolor.txt` in `ipsum`, you should use the path `ipsum/dolor.txt`.\n</example>",
              "type": "string",
              "nullable": true
            }
          },
          "description": "Get errors and warnings for the project or a specific file.\n\nThis tool can be invoked after a series of edits to determine if further edits are necessary, or if the user asks to fix errors or warnings in their codebase.\n\nWhen a path is provided, shows all diagnostics for that specific file.\nWhen no path is provided, shows a summary of error and warning counts for all files in the project.\n\n<example>\nTo get diagnostics for a specific file:\n{\n    \"path\": \"src/main.rs\"\n}\n\nTo get a project-wide diagnostic summary:\n{}\n</example>\n\n<guidelines>\n- If you think you can fix a diagnostic, make 1-2 attempts and then give up.\n- Don't remove code you've generated just because you can't fix an error. The user can help you fix it.\n</guidelines>",
          "type": "object"
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "edit_file",
        "description": "This is a tool for creating a new file or editing an existing file. For moving or renaming files, you should generally use the `move_path` tool instead.\n\nBefore using this tool:\n\n1. Use the `read_file` tool to understand the file's contents and context\n\n2. Verify the directory path is correct (only applicable when creating new files):\n   - Use the `list_directory` tool to verify the parent directory exists and is the correct location",
        "parameters": {
          "required": [
            "display_description",
            "path",
            "mode"
          ],
          "description": "This is a tool for creating a new file or editing an existing file. For moving or renaming files, you should generally use the `move_path` tool instead.\n\nBefore using this tool:\n\n1. Use the `read_file` tool to understand the file's contents and context\n\n2. Verify the directory path is correct (only applicable when creating new files):\n   - Use the `list_directory` tool to verify the parent directory exists and is the correct location",
          "type": "object",
          "properties": {
            "display_description": {
              "description": "A one-line, user-friendly markdown description of the edit. This will be shown in the UI and also passed to another model to perform the edit.\n\nBe terse, but also descriptive in what you want to achieve with this edit. Avoid generic instructions.\n\nNEVER mention the file path in this description.\n\n<example>Fix API endpoint URLs</example>\n<example>Update copyright year in `page_footer`</example>\n\nMake sure to include this field before all the others in the input object so that we can display it immediately.",
              "type": "string"
            },
            "path": {
              "description": "The full path of the file to create or modify in the project.\n\nWARNING: When specifying which file path need changing, you MUST start each path with one of the project's root directories.\n\nThe following examples assume we have two root directories in the project:\n- /a/b/backend\n- /c/d/frontend\n\n<example>\n`backend/src/main.rs`\n\nNotice how the file path starts with `backend`. Without that, the path would be ambiguous and the call would fail!\n</example>\n\n<example>\n`frontend/db.js`\n</example>",
              "type": "string"
            },
            "mode": {
              "description": "The mode of operation on the file. Possible values:\n- 'edit': Make granular edits to an existing file.\n- 'create': Create a new file if it doesn't exist.\n- 'overwrite': Replace the entire contents of an existing file.\n\nWhen a file already exists or you just created it, prefer editing it as opposed to recreating it from scratch.",
              "type": "string",
              "enum": [
                "edit",
                "create",
                "overwrite"
              ]
            }
          }
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "fetch",
        "description": "Fetches a URL and returns the content as Markdown.",
        "parameters": {
          "required": [
            "url"
          ],
          "description": "Fetches a URL and returns the content as Markdown.",
          "type": "object",
          "properties": {
            "url": {
              "description": "The URL to fetch.",
              "type": "string"
            }
          }
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "find_path",
        "description": "Fast file path pattern matching tool that works with any codebase size\n\n- Supports glob patterns like \"**/*.js\" or \"src/**/*.ts\"\n- Returns matching file paths sorted alphabetically\n- Prefer the `grep` tool to this tool when searching for symbols unless you have specific information about paths.\n- Use this tool when you need to find files by name patterns\n- Results are paginated with 50 matches per page. Use the optional 'offset' parameter to request subsequent pages.",
        "parameters": {
          "required": [
            "glob"
          ],
          "description": "Fast file path pattern matching tool that works with any codebase size\n\n- Supports glob patterns like \"**/*.js\" or \"src/**/*.ts\"\n- Returns matching file paths sorted alphabetically\n- Prefer the `grep` tool to this tool when searching for symbols unless you have specific information about paths.\n- Use this tool when you need to find files by name patterns\n- Results are paginated with 50 matches per page. Use the optional 'offset' parameter to request subsequent pages.",
          "type": "object",
          "properties": {
            "glob": {
              "description": "The glob to match against every path in the project.\n\n<example>\nIf the project has the following root directories:\n\n- directory1/a/something.txt\n- directory2/a/things.txt\n- directory3/a/other.txt\n\nYou can get back the first two paths by providing a glob of \"*thing*.txt\"\n</example>",
              "type": "string"
            },
            "offset": {
              "description": "Optional starting position for paginated results (0-based).\nWhen not provided, starts from the beginning.",
              "type": "integer",
              "default": 0,
              "minimum": 0
            }
          }
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "grep",
        "description": "Searches the contents of files in the project with a regular expression\n\n- Prefer this tool to path search when searching for symbols in the project, because you won't need to guess what path it's in.\n- Supports full regex syntax (eg. \"log.*Error\", \"function\\\\s+\\\\w+\", etc.)\n- Pass an `include_pattern` if you know how to narrow your search on the files system\n- Never use this tool to search for paths. Only search file contents with this tool.\n- Use this tool when you need to find files containing specific patterns\n- Results are paginated with 20 matches per page. Use the optional 'offset' parameter to request subsequent pages.\n- DO NOT use HTML entities solely to escape characters in the tool parameters.",
        "parameters": {
          "required": [
            "regex"
          ],
          "description": "Searches the contents of files in the project with a regular expression\n\n- Prefer this tool to path search when searching for symbols in the project, because you won't need to guess what path it's in.\n- Supports full regex syntax (eg. \"log.*Error\", \"function\\\\s+\\\\w+\", etc.)\n- Pass an `include_pattern` if you know how to narrow your search on the files system\n- Never use this tool to search for paths. Only search file contents with this tool.\n- Use this tool when you need to find files containing specific patterns\n- Results are paginated with 20 matches per page. Use the optional 'offset' parameter to request subsequent pages.\n- DO NOT use HTML entities solely to escape characters in the tool parameters.",
          "type": "object",
          "properties": {
            "regex": {
              "description": "A regex pattern to search for in the entire project. Note that the regex will be parsed by the Rust `regex` crate.\n\nDo NOT specify a path here! This will only be matched against the code **content**.",
              "type": "string"
            },
            "include_pattern": {
              "description": "A glob pattern for the paths of files to include in the search.\nSupports standard glob patterns like \"**/*.rs\" or \"frontend/src/**/*.ts\".\nIf omitted, all files in the project will be searched.\n\nThe glob pattern is matched against the full path including the project root directory.\n\n<example>\nIf the project has the following root directories:\n\n- /a/b/backend\n- /c/d/frontend\n\nUse \"backend/**/*.rs\" to search only Rust files in the backend root directory.\nUse \"frontend/src/**/*.ts\" to search TypeScript files only in the frontend root directory (sub-directory \"src\").\nUse \"**/*.rs\" to search Rust files across all root directories.\n</example>",
              "type": "string",
              "nullable": true
            },
            "offset": {
              "description": "Optional starting position for paginated results (0-based).\nWhen not provided, starts from the beginning.",
              "type": "integer",
              "default": 0,
              "minimum": 0
            },
            "case_sensitive": {
              "description": "Whether the regex is case-sensitive. Defaults to false (case-insensitive).",
              "type": "boolean",
              "default": false
            }
          }
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "list_directory",
        "description": "Lists files and directories in a given path. Prefer the `grep` or `find_path` tools when searching the codebase.",
        "parameters": {
          "required": [
            "path"
          ],
          "description": "Lists files and directories in a given path. Prefer the `grep` or `find_path` tools when searching the codebase.",
          "type": "object",
          "properties": {
            "path": {
              "description": "The fully-qualified path of the directory to list in the project.\n\nThis path should never be absolute, and the first component of the path should always be a root directory in a project.\n\n<example>\nIf the project has the following root directories:\n\n- directory1\n- directory2\n\nYou can list the contents of `directory1` by using the path `directory1`.\n</example>\n\n<example>\nIf the project has the following root directories:\n\n- foo\n- bar\n\nIf you wanna list contents in the directory `foo/baz`, you should use the path `foo/baz`.\n</example>",
              "type": "string"
            }
          }
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "move_path",
        "description": "Moves or rename a file or directory in the project, and returns confirmation that the move succeeded.\n\nIf the source and destination directories are the same, but the filename is different, this performs a rename. Otherwise, it performs a move.\n\nThis tool should be used when it is desirable to move or rename a file or directory without changing its contents at all.",
        "parameters": {
          "required": [
            "source_path",
            "destination_path"
          ],
          "description": "Moves or rename a file or directory in the project, and returns confirmation that the move succeeded.\n\nIf the source and destination directories are the same, but the filename is different, this performs a rename. Otherwise, it performs a move.\n\nThis tool should be used when it is desirable to move or rename a file or directory without changing its contents at all.",
          "type": "object",
          "properties": {
            "source_path": {
              "description": "The source path of the file or directory to move/rename.\n\n<example>\nIf the project has the following files:\n\n- directory1/a/something.txt\n- directory2/a/things.txt\n- directory3/a/other.txt\n\nYou can move the first file by providing a source_path of \"directory1/a/something.txt\"\n</example>",
              "type": "string"
            },
            "destination_path": {
              "description": "The destination path where the file or directory should be moved/renamed to.\nIf the paths are the same except for the filename, then this will be a rename.\n\n<example>\nTo move \"directory1/a/something.txt\" to \"directory2/b/renamed.txt\",\nprovide a destination_path of \"directory2/b/renamed.txt\"\n</example>",
              "type": "string"
            }
          }
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "now",
        "description": "Returns the current datetime in RFC 3339 format.\nOnly use this tool when the user specifically asks for it or the current task would benefit from knowing the current datetime.",
        "parameters": {
          "required": [
            "timezone"
          ],
          "description": "Returns the current datetime in RFC 3339 format.\nOnly use this tool when the user specifically asks for it or the current task would benefit from knowing the current datetime.",
          "type": "object",
          "properties": {
            "timezone": {
              "description": "The timezone to use for the datetime.",
              "anyOf": [
                {
                  "description": "Use UTC for the datetime.",
                  "type": "string",
                  "enum": [
                    "utc"
                  ]
                },
                {
                  "description": "Use local time for the datetime.",
                  "type": "string",
                  "enum": [
                    "local"
                  ]
                }
              ]
            }
          }
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "open",
        "description": "This tool opens a file or URL with the default application associated with it on the user's operating system:\n\n- On macOS, it's equivalent to the `open` command\n- On Windows, it's equivalent to `start`\n- On Linux, it uses something like `xdg-open`, `gio open`, `gnome-open`, `kde-open`, `wslview` as appropriate\n\nFor example, it can open a web browser with a URL, open a PDF file with the default PDF viewer, etc.\n\nYou MUST ONLY use this tool when the user has explicitly requested opening something. You MUST NEVER assume that the user would like for you to use this tool.",
        "parameters": {
          "required": [
            "path_or_url"
          ],
          "description": "This tool opens a file or URL with the default application associated with it on the user's operating system:\n\n- On macOS, it's equivalent to the `open` command\n- On Windows, it's equivalent to `start`\n- On Linux, it uses something like `xdg-open`, `gio open`, `gnome-open`, `kde-open`, `wslview` as appropriate\n\nFor example, it can open a web browser with a URL, open a PDF file with the default PDF viewer, etc.\n\nYou MUST ONLY use this tool when the user has explicitly requested opening something. You MUST NEVER assume that the user would like for you to use this tool.",
          "type": "object",
          "properties": {
            "path_or_url": {
              "description": "The path or URL to open with the default application.",
              "type": "string"
            }
          }
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "read_file",
        "description": "Reads the content of the given file in the project.\n\n- Never attempt to read a path that hasn't been previously mentioned.\n- For large files, this tool returns a file outline with symbol names and line numbers instead of the full content.\n  This outline IS a successful response - use the line numbers to read specific sections with start_line/end_line.\n  Do NOT retry reading the same file without line numbers if you receive an outline.\n- This tool supports reading image files. Supported formats: PNG, JPEG, WebP, GIF, BMP, TIFF.\n  Image files are returned as visual content that you can analyze directly.",
        "parameters": {
          "required": [
            "path"
          ],
          "description": "Reads the content of the given file in the project.\n\n- Never attempt to read a path that hasn't been previously mentioned.\n- For large files, this tool returns a file outline with symbol names and line numbers instead of the full content.\n  This outline IS a successful response - use the line numbers to read specific sections with start_line/end_line.\n  Do NOT retry reading the same file without line numbers if you receive an outline.\n- This tool supports reading image files. Supported formats: PNG, JPEG, WebP, GIF, BMP, TIFF.\n  Image files are returned as visual content that you can analyze directly.",
          "type": "object",
          "properties": {
            "path": {
              "description": "The relative path of the file to read.\n\nThis path should never be absolute, and the first component of the path should always be a root directory in a project.\n\n<example>\nIf the project has the following root directories:\n\n- /a/b/directory1\n- /c/d/directory2\n\nIf you want to access `file.txt` in `directory1`, you should use the path `directory1/file.txt`.\nIf you want to access `file.txt` in `directory2`, you should use the path `directory2/file.txt`.\n</example>",
              "type": "string"
            },
            "start_line": {
              "description": "Optional line number to start reading on (1-based index)",
              "type": "integer",
              "nullable": true,
              "minimum": 0,
              "default": null
            },
            "end_line": {
              "description": "Optional line number to end reading on (1-based index, inclusive)",
              "type": "integer",
              "nullable": true,
              "minimum": 0,
              "default": null
            }
          }
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "restore_file_from_disk",
        "description": "Discards unsaved changes in open buffers by reloading file contents from disk.\n\nUse this tool when:\n- You attempted to edit files but they have unsaved changes the user does not want to keep.\n- You want to reset files to the on-disk state before retrying an edit.\n\nOnly use this tool after asking the user for permission, because it will discard unsaved changes.",
        "parameters": {
          "required": [
            "paths"
          ],
          "description": "Discards unsaved changes in open buffers by reloading file contents from disk.\n\nUse this tool when:\n- You attempted to edit files but they have unsaved changes the user does not want to keep.\n- You want to reset files to the on-disk state before retrying an edit.\n\nOnly use this tool after asking the user for permission, because it will discard unsaved changes.",
          "type": "object",
          "properties": {
            "paths": {
              "description": "The paths of the files to restore from disk.",
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          }
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "save_file",
        "description": "Saves files that have unsaved changes.\n\nUse this tool when you need to edit files but they have unsaved changes that must be saved first.\nOnly use this tool after asking the user for permission to save their unsaved changes.",
        "parameters": {
          "required": [
            "paths"
          ],
          "description": "Saves files that have unsaved changes.\n\nUse this tool when you need to edit files but they have unsaved changes that must be saved first.\nOnly use this tool after asking the user for permission to save their unsaved changes.",
          "type": "object",
          "properties": {
            "paths": {
              "description": "The paths of the files to save.",
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          }
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "spawn_agent",
        "description": "Spawns an agent to perform a delegated task.\n\nUse this tool when you want to:\n- Run multiple tasks in parallel.\n- Delegate a self-contained task where you only need the final outcome.\n\nDo NOT use this tool for tasks you could accomplish directly with one or two tool calls (e.g. reading a file, running a single command).\n\nYou will receive only the agent's final message as output.\n\n**New session** (no session_id): Creates a new agent that does NOT see your conversation history. Include all relevant context (file paths, requirements, constraints) in the message.\n\n**Follow-up** (with session_id): Sends a follow-up to an existing agent session. The agent already has full context, so send only a short, direct message — do NOT repeat the original task or context. Examples: \"Also update the tests\", \"Fix the compile error in foo.rs\", \"Retry\".\n\n- If spawning multiple agents that might write to the filesystem, provide guidance on how to avoid conflicts (e.g. assign each to different directories).",
        "parameters": {
          "required": [
            "label",
            "message"
          ],
          "description": "Spawns an agent to perform a delegated task.\n\nUse this tool when you want to:\n- Run multiple tasks in parallel.\n- Delegate a self-contained task where you only need the final outcome.\n\nDo NOT use this tool for tasks you could accomplish directly with one or two tool calls (e.g. reading a file, running a single command).\n\nYou will receive only the agent's final message as output.\n\n**New session** (no session_id): Creates a new agent that does NOT see your conversation history. Include all relevant context (file paths, requirements, constraints) in the message.\n\n**Follow-up** (with session_id): Sends a follow-up to an existing agent session. The agent already has full context, so send only a short, direct message — do NOT repeat the original task or context. Examples: \"Also update the tests\", \"Fix the compile error in foo.rs\", \"Retry\".\n\n- If spawning multiple agents that might write to the filesystem, provide guidance on how to avoid conflicts (e.g. assign each to different directories).",
          "type": "object",
          "properties": {
            "label": {
              "description": "Short label displayed in the UI while the agent runs (e.g., \"Researching alternatives\")",
              "type": "string"
            },
            "message": {
              "description": "The prompt for the agent. For new sessions, include full context needed for the task. For follow-ups (with session_id), you can rely on the agent already having the previous message.",
              "type": "string"
            },
            "session_id": {
              "description": "Session ID of an existing agent session to continue instead of creating a new one.",
              "type": "string",
              "default": null,
              "nullable": true
            }
          }
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "terminal",
        "description": "Executes a shell one-liner and returns the combined output.\n\nThis tool spawns a process using the user's shell, reads from stdout and stderr (preserving the order of writes), and returns a string with the combined output result.\n\nThe output results will be shown to the user already, only list it again if necessary, avoid being redundant.\n\nMake sure you use the `cd` parameter to navigate to one of the root directories of the project. NEVER do it as part of the `command` itself, otherwise it will error.\n\nDo not use this tool for commands that run indefinitely, such as servers (like `npm run start`, `npm run dev`, `python -m http.server`, etc) or file watchers that don't terminate on their own.\n\nFor potentially long-running commands, prefer specifying `timeout_ms` to bound runtime and prevent indefinite hangs.\n\nRemember that each invocation of this tool will spawn a new shell process, so you can't rely on any state from previous invocations.\n\nThe terminal emulator is an interactive pty, so commands may block waiting for user input.\nSome commands can be configured not to do this, such as `git --no-pager diff` and similar.",
        "parameters": {
          "required": [
            "command",
            "cd"
          ],
          "description": "Executes a shell one-liner and returns the combined output.\n\nThis tool spawns a process using the user's shell, reads from stdout and stderr (preserving the order of writes), and returns a string with the combined output result.\n\nThe output results will be shown to the user already, only list it again if necessary, avoid being redundant.\n\nMake sure you use the `cd` parameter to navigate to one of the root directories of the project. NEVER do it as part of the `command` itself, otherwise it will error.\n\nDo not use this tool for commands that to run indefinitely, such as servers (like `npm run start`, `npm run dev`, `python -m http.server`, etc) or file watchers that don't terminate on their own.\n\nFor potentially long-running commands, prefer specifying `timeout_ms` to bound runtime and prevent indefinite hangs.\n\nRemember that each invocation of this tool will spawn a new shell process, so you can't rely on any state from previous invocations.\n\nThe terminal emulator is an interactive pty, so commands may block waiting for user input.\nSome commands can be configured not to do this, such as `git --no-pager diff` and similar.",
          "type": "object",
          "properties": {
            "command": {
              "description": "The one-liner command to execute.",
              "type": "string"
            },
            "cd": {
              "description": "Working directory for the command. This must be one of the root directories of the project.",
              "type": "string"
            },
            "timeout_ms": {
              "description": "Optional maximum runtime (in milliseconds). If exceeded, the running terminal task is killed.",
              "type": "integer",
              "nullable": true,
              "minimum": 0
            }
          }
        }
      }
    }
  ]
};