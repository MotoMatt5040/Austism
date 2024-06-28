from dotenv import load_dotenv
load_dotenv()


import os
import random
import datetime


import discord
from discord.ext import commands, tasks


from database import Database
from counters import Counters

intents = discord.Intents.all()
client = commands.Bot(command_prefix="!", intents=intents)
db = Database()
counters = Counters()


@client.event
async def on_ready():
    print("online")
    print("-"*20)
    if not motd.is_running():
        motd.start()


@client.event
async def on_message(message):
    author = str(message.author)
    if message.content.startswith("!"):
        if not author == 'sagginswaggin':
            await client.process_commands(message)
            await message.delete()

    if not author == 'sagginswaggin':
        counters.respond_to_austin_counter = 0
        return

    counters.respond_to_austin_counter += 1
    if counters.respond_to_austin_counter >= 3:
        channel = client.get_channel(message.channel.id)
        random_messages = ['bro shutup', 'i do not care.', 'you type a lot', 'i was trying to ignore you', "You're so funny!"]
        await channel.send(random.choice(random_messages))
        counters.respond_to_austin_counter = 0

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
    author = str(after)

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


@tasks.loop(time=datetime.time(hour=2))  # 0 is 7pm central, so add 5 hours for your time for central time
async def motd():
    channel = client.get_channel(int(os.environ['skinwalkers_gen']))
    message = db.get_random_message()

    if message['embed'] != 'None':
        await channel.send(message['content'])
    elif message['attachment'] != 'None':
        await channel.send(message['attachment'])
    else:
        await channel.send(message['content'])


@client.event
async def on_guild_join(guild):
    db.initialize_server(server_id=guild)


@client.command()
async def r(ctx):
    channel = client.get_channel(int(os.environ['skinwalkers_general']))
    message = db.get_random_message()

    if message['embed'] != 'None':
        await channel.send(message['content'])
    elif message['attachment'] != 'None':
        await channel.send(message['attachment'])
    else:
        await channel.send(message['content'])


client.run(os.environ['token'])


if __name__ == "__main__":
    pass
