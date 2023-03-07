import express, { Request, Response } from "express"
import cors from "cors"
import axios from "axios"
import { AppDataSource } from "./data-source"
import { Product } from "./entity/product"
import * as amqp from 'amqplib/callback_api'

const app = express()
const PORT = 3001

const bootstrap = async () => {
  const dataSource = await AppDataSource.initialize()
  const productRepository = dataSource.getRepository(Product)

  amqp.connect("amqp://admin:admin@rabbitmq:5672/products", (err, con) => {
    if (err) throw err

    con.createChannel((err, channel) => {
      if (err) throw err

      channel.assertQueue('product_created', { durable: false })
      channel.assertQueue('product_updated', { durable: false })
      channel.assertQueue('product_deleted', { durable: false })

      app.use(cors({}))
      app.use(express.json())

      channel.consume('product_created', async (msg) => {
        const eventProduct: Product = JSON.parse((msg as amqp.Message).content.toString())
        const product = new Product()
        product.admin_id = parseInt(eventProduct.id)
        product.title = eventProduct.title
        product.image = eventProduct.image
        product.likes = eventProduct.likes
        await productRepository.save(product)
        console.log('product created')
      }, { noAck: true })

      channel.consume('product_updated', async (msg) => {
        const eventProduct: Product = JSON.parse((msg as amqp.Message).content.toString())
        const product = await productRepository.findOne({ where: { admin_id: parseInt(eventProduct.id) } })
        if (!product) throw new Error('Product not found')
        productRepository.merge(product, {
          title: eventProduct.title,
          image: eventProduct.image,
          likes: eventProduct.likes,
        })
        await productRepository.save(product)
        console.log('product updated')
      }, { noAck: true })

      channel.consume('product_deleted', async (msg) => {
        const admin_id = parseInt((msg as amqp.Message).content.toString())
        await productRepository.delete({ admin_id })
        console.log('product deleted')
      }, { noAck: true })
      
      app.get('/api/products', async (req: Request, res: Response) => {
        const products = await productRepository.find()
        return res.json(products)
      })
    
      app.post('/api/products/:id/like', async (req: Request, res: Response) => {
        try {
          const product = await productRepository.findOne({ where: { admin_id: parseInt(req.params.id) } })
          if (!product) return res.status(404).send('Product not found')
          // using http request
          await axios.post(`http://admin:3000/api/products/${product.admin_id}/like`, {})
          product.likes++
          const result = await productRepository.save(product)
          return res.json(result)
        } catch (error: any) {
          return res.status(error.status).send(error.message)
        }
      })
      
      app.listen(PORT, async () => {
        console.log(`Listening to port ${PORT}`)
      })

      process.on('beforeExit', () => {
        console.log('RabbitMQ closing...')
        con.close()
      })
    })
  })
}

bootstrap()
