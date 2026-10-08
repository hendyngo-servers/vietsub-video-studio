export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return new Response("Vietsub Edge Computing Active!", { status: 200 });
  },
};\n