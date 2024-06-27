from dotenv import load_dotenv
load_dotenv()


import os


import discord
from discord.ext import commands
from database import Database


intents = discord.Intents.all()
client = commands.Bot(command_prefix="!", intents=intents)
db = Database()


@client.event
async def on_ready():
    print("online")
    print("-"*20)


@client.event
async def on_message(message):
    author = str(message.author)

    if not author == 'sagginswaggin':
        return

    guild = str(message.guild).replace(' ', '_')
    content = message.content
    rec_date = message.created_at
    try:
        attachment = message.attachments[0]
    except IndexError:
        attachment = None

    try:
        embed = message.embeds[0]
    except IndexError:
        embed = None

    db.insert_message(
        server_id=guild,
        message_id=message.id,
        content=content,
        rec_date=rec_date,
        attachment=attachment,
        embed=embed
    )

@client.event
async def on_message_edit(before, after):
    author = str(after.author)

    if not author == 'sagginswaggin':
        return

    guild = str(after.guild).replace(' ', '_')
    content = after.content
    rec_date = after.created_at
    try:
        attachment = after.attachments[0]
    except IndexError:
        attachment = None

    try:
        embed = after.embeds[0]
    except IndexError:
        embed = None

    db.insert_message(
        server_id=guild,
        message_id=after.id,
        content=content,
        rec_date=rec_date,
        attachment=attachment,
        embed=embed
    )


@client.event
async def on_guild_join(guild):
    db.initialize_server(server_id=guild)


client.run(os.environ['token'])


if __name__ == "__main__":
    pass
