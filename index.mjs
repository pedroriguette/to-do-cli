#!/usr/bin/env node
import { Command } from 'commander'
import path from 'node:path'
import fs from 'fs'
import inquirer from 'inquirer'
import chalk from 'chalk'
import Table from 'cli-table'
import shell from 'shelljs'
import figlet from 'figlet'

const __dirname = import.meta.dirname
const todoPath = path.join(__dirname, 'todos.json')

const program = new Command()

function getJson(path) {
    const data = fs.existsSync(path) ? fs.readFileSync(path) : []
    try {
        return JSON.parse(data)
    } catch (e) {
        return []
    }
}

function saveJson(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, '\t'))
}

function showTodoTable(data) {
    const table = new Table({
        head: ['id', 'to-do', 'status'],
        colWidths: [10, 20, 10]
    })
    data.map((todo, index) => {
        table.push(
            [index + 1, todo.title, todo.done ? chalk.green('done') : chalk.red('not done')]
        )
    })
    console.log(table.toString())
}

console.log(chalk.cyan(figlet.textSync("To-do CLI")))

program
    .version('1.0.0')
    .command('add [string]')
    .description('adiciona um to-do')
    .option('-s, --status [status]', 'Status inicial do to-do')
    .action(async (todo, options) => {
        let answers = {}
        if (!todo) {
            answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'todo',
                    message: 'Qual é o seu to-do?',
                    validate: value => value ? true : 'não é permitido um to-do'
                },
            ])
        }
        const data = getJson(todoPath)
        data.push(
            {
                title: todo || answers.todo,
                done: (options.status === 'true') || false
            }
        )
        saveJson(todoPath, data)
        console.log(chalk.green('To-do adicionado com sucesso!'))
    })

program
    .command('do <id>')
    .description('marca um to-do como feito')
    .action(async (id) => {
        let answers
        if (!id) {
            answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'todo',
                    message: 'Qual o id do to-do?',
                    validate: value => value !== undefined ? true : 'Defina um to-do para ser atualizado'
                }

            ])
        }
        const data = getJson(todoPath)

        try {
            data[id - 1].done = true
            saveJson(todoPath, data)
            console.log(chalk.green('To-do salvo com sucesso'))
            showTodoTable(data)
        } catch {
            console.log(chalk.red('O Id não existe'))
        }

    })

program
    .command('undo <id>')
    .description('Marca o to-do como não feito')
    .action(async (id) => {
        let answers
        if (!id) {
            answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'todo',
                    message: 'Qual o id do to-do',
                    validate: value => value ? true : 'Defina um to-do para ser atualizado'
                }
            ])
        }
        const data = getJson(todoPath)
        try {
            data[id - 1].done = false
            saveJson(todoPath, data)
            console.log(chalk.green('To-do salvo com sucesso!'))
            showTodoTable(data)
        } catch {
            console.log(chalk.red('O Id não existe'))
        }


    })

program
    .command('list')
    .description('lista todo os to-dos')
    .action(() => {
        const data = getJson(todoPath)
        showTodoTable(data)
    })

program
    .command('backup')
    .description('Faz um backup do to-dos')
    .action(() => {
        shell.mkdir('-p', 'backup')
        const command = shell.exec('copy "./todos.json" "./backup/todos.json" ', { silent: true })
        if (!command.code) {
            console.log(chalk.green('Backup realizado com sucesso! To-dos zerados'))
        } else {
            console.log(command.stderr)
            console.log(chalk.red('Erro ao realizar backup'))
        }
    })

program
    .command('restore')
    .description('Restaure os dados feitos no backup')
    .action(() => {
        const existPathBackup = fs.existsSync('./backup/todos.json')
        if (existPathBackup) {
            const contentBackup = fs.readFileSync("./backup/todos.json")
            const restore = fs.writeFileSync('./todos.json', contentBackup)
            console.log(chalk.green('Dados Restaurados com sucesso'))
        } else {
            console.log(chalk.red('O arquivo não existe, faça um backup primeiro'))
        }

    })


program.parse(process.argv)